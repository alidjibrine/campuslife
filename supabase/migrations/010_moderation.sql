-- 010_moderation.sql
-- Les signalements existent depuis la 004 mais personne ne pouvait les lire
-- autrement que dans le tableau de bord Supabase. Cette migration cree le role
-- de moderateur et ouvre le necessaire pour traiter un signalement depuis l'app.

-- 1. Le role -------------------------------------------------------------------

alter table public.profiles
  add column if not exists role text not null default 'membre';

alter table public.profiles drop constraint if exists profiles_role_valide;
alter table public.profiles
  add constraint profiles_role_valide check (role in ('membre', 'moderateur'));

-- Un membre peut modifier son propre profil : sans ce garde-fou, il pourrait
-- se nommer moderateur lui-meme. Le role ne se change que hors session, donc
-- depuis le tableau de bord ou une migration.
create or replace function public.protect_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Le role ne peut pas etre modifie depuis l application';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_role on public.profiles;
create trigger trg_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

create or replace function public.est_moderateur()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role = 'moderateur'
  );
$$;

revoke execute on function public.est_moderateur() from public, anon;
grant execute on function public.est_moderateur() to authenticated;

-- 2. Ce qu'un moderateur peut voir et faire ------------------------------------
-- Toujours dans son etablissement, jamais ailleurs.

drop policy if exists reports_select_moderateur on public.reports;
create policy reports_select_moderateur on public.reports
  for select to authenticated
  using (public.est_moderateur() and school_id = public.my_school_id());

drop policy if exists reports_update_moderateur on public.reports;
create policy reports_update_moderateur on public.reports
  for update to authenticated
  using (public.est_moderateur() and school_id = public.my_school_id())
  with check (public.est_moderateur() and school_id = public.my_school_id());

drop policy if exists posts_delete_moderateur on public.posts;
create policy posts_delete_moderateur on public.posts
  for delete to authenticated
  using (public.est_moderateur() and school_id = public.my_school_id());

drop policy if exists comments_delete_moderateur on public.comments;
create policy comments_delete_moderateur on public.comments
  for delete to authenticated
  using (
    public.est_moderateur()
    and exists (
      select 1 from public.posts p
       where p.id = comments.post_id and p.school_id = public.my_school_id()
    )
  );

-- 3. La liste a traiter ---------------------------------------------------------
-- Le contenu signale ne peut pas etre joint en SQL ordinaire : la cible est
-- tantot une publication, tantot un commentaire, tantot un profil. D'ou cette
-- fonction, qui rapatrie l'extrait et l'auteur selon le type.

create or replace function public.signalements_a_traiter()
returns table (
  id uuid,
  cree_le timestamptz,
  motif text,
  detail text,
  statut text,
  cible_type text,
  cible_id uuid,
  contenu text,
  auteur_nom text,
  auteur_id uuid,
  existe boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_moderateur() then
    raise exception 'Reserve aux moderateurs';
  end if;

  return query
  select r.id,
         r.created_at,
         r.reason,
         r.detail,
         r.status,
         r.target_type,
         r.target_id,
         case r.target_type
           when 'post' then (select left(p.content, 400) from public.posts p where p.id = r.target_id)
           when 'comment' then (select left(c.content, 400) from public.comments c where c.id = r.target_id)
           when 'profile' then (select left(coalesce(pr.bio, ''), 400) from public.profiles pr where pr.id = r.target_id)
         end,
         case r.target_type
           when 'post' then (select p.author_name from public.posts p where p.id = r.target_id)
           when 'comment' then (select c.author_name from public.comments c where c.id = r.target_id)
           when 'profile' then (select nullif(btrim(coalesce(pr.first_name, '') || ' ' || coalesce(pr.last_name, '')), '') from public.profiles pr where pr.id = r.target_id)
         end,
         case r.target_type
           when 'post' then (select p.user_id from public.posts p where p.id = r.target_id)
           when 'comment' then (select c.user_id from public.comments c where c.id = r.target_id)
           when 'profile' then r.target_id
         end,
         case r.target_type
           when 'post' then exists (select 1 from public.posts p where p.id = r.target_id)
           when 'comment' then exists (select 1 from public.comments c where c.id = r.target_id)
           when 'profile' then exists (select 1 from public.profiles pr where pr.id = r.target_id)
           else false
         end
    from public.reports r
   where r.school_id = public.my_school_id()
   order by (r.status = 'nouveau') desc, r.created_at desc;
end;
$$;

revoke execute on function public.signalements_a_traiter() from public, anon;
grant execute on function public.signalements_a_traiter() to authenticated;

-- 4. Traiter -------------------------------------------------------------------
-- Une decision classe tous les signalements portant sur le meme contenu, pour
-- qu'un contenu signale dix fois ne revienne pas dix fois dans la liste.

create or replace function public.traiter_signalement(
  signalement uuid,
  decision text,
  supprimer boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not public.est_moderateur() then
    raise exception 'Reserve aux moderateurs';
  end if;
  if decision not in ('traite', 'rejete') then
    raise exception 'Decision inconnue';
  end if;

  select * into r
    from public.reports
   where id = signalement and school_id = public.my_school_id();
  if r.id is null then
    raise exception 'Signalement introuvable';
  end if;

  if supprimer then
    if r.target_type = 'post' then
      delete from public.comments where post_id = r.target_id;
      delete from public.post_likes where post_id = r.target_id;
      delete from public.posts where id = r.target_id;
    elsif r.target_type = 'comment' then
      delete from public.comments where id = r.target_id;
    end if;
  end if;

  update public.reports
     set status = decision, handled_at = now()
   where target_type = r.target_type
     and target_id = r.target_id
     and school_id = r.school_id
     and status = 'nouveau';
end;
$$;

revoke execute on function public.traiter_signalement(uuid, text, boolean) from public, anon;
grant execute on function public.traiter_signalement(uuid, text, boolean) to authenticated;
