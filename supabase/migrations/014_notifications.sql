-- 014_notifications.sql
--
-- Les jetons de notification, un par appareil.
--
-- Un compte peut en avoir plusieurs : le telephone et la tablette. Le jeton
-- lui-meme est unique, parce qu'un appareil revendu ou reinstalle peut se
-- retrouver rattache a un autre compte : c'est le dernier qui gagne.
--
-- Ces jetons ne sont lisibles par personne d'autre que leur proprietaire. La
-- fonction serveur qui envoie les notifications les lit avec le role de
-- service, donc hors des regles d'acces.

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  plateforme text not null default 'inconnue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists push_tokens_select on public.push_tokens;
create policy push_tokens_select on public.push_tokens
  for select to authenticated using (user_id = auth.uid());

drop policy if exists push_tokens_insert on public.push_tokens;
create policy push_tokens_insert on public.push_tokens
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists push_tokens_update on public.push_tokens;
create policy push_tokens_update on public.push_tokens
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_tokens_delete on public.push_tokens;
create policy push_tokens_delete on public.push_tokens
  for delete to authenticated using (user_id = auth.uid());

-- La suppression de compte reste explicite, comme pour les autres tables,
-- meme si la cascade ferait le travail.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Non connecte';
  end if;

  delete from public.push_tokens where user_id = uid;
  delete from public.reports where reporter_id = uid;
  delete from public.reports where target_id = uid;

  delete from public.messages where conversation_id in (
    select id from public.conversations where user_a = uid or user_b = uid
  );
  delete from public.conversations where user_a = uid or user_b = uid;
  delete from public.post_likes where user_id = uid;
  delete from public.comments where user_id = uid;
  delete from public.post_likes where post_id in (select id from public.posts where user_id = uid);
  delete from public.comments where post_id in (select id from public.posts where user_id = uid);
  delete from public.posts where user_id = uid;
  delete from public.follows where follower_id = uid or following_id = uid;
  delete from public.profile_views where profile_id = uid or viewer_id = uid;
  delete from public.timetable_events where user_id = uid;
  delete from public.timetable_sources where user_id = uid;
  delete from public.assignments where user_id = uid;
  delete from public.grades where user_id = uid;
  delete from public.courses where user_id = uid;
  delete from public.transactions where user_id = uid;
  delete from public.category_budgets where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
