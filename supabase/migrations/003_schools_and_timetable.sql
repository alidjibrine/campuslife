-- ============================================================
-- CAMPUSLIFE - Migration 003 : ecoles et emploi du temps
-- Appliquee le 6 septembre 2026.
-- ============================================================
-- Ajoute a la base de juin les deux briques que le cadrage exige :
--   1. un referentiel d'ecoles, avec rattachement par domaine e-mail
--   2. la fermeture de la communaute a l'ecole de l'etudiant
--   3. l'import d'emploi du temps (lien iCalendar ou fichier)
-- Nommage en anglais, comme le reste de la base.
-- ============================================================

-- 1. Referentiel des ecoles ---------------------------------------

create table if not exists schools (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  short_name     text,
  city           text not null,
  kind           text not null default 'university'
                 check (kind in ('university','school','iut','bts','other')),
  email_domains  text[] not null default '{}',
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists idx_schools_domains on schools using gin (email_domains);

alter table schools enable row level security;

drop policy if exists schools_select on schools;
create policy schools_select on schools
  for select to authenticated
  using (active = true);

insert into schools (name, short_name, city, kind, email_domains)
select 'Université de Strasbourg', 'Unistra', 'Strasbourg', 'university',
       '{etu.unistra.fr,unistra.fr}'
where not exists (select 1 from schools where name = 'Université de Strasbourg');

-- 2. Rattachement du profil a son ecole ---------------------------

alter table profiles add column if not exists school_id uuid references schools(id) on delete set null;
create index if not exists idx_profiles_school on profiles(school_id);

update profiles p
set school_id = s.id
from schools s
where p.school_id is null and lower(trim(p.school)) = lower(s.name);

-- Mon ecole. Fonction security definer indispensable : sans elle, une
-- politique posee sur profiles qui interroge profiles part en recursion.
create or replace function public.my_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid()
$$;

-- Rattachement automatique a l'inscription, par le domaine de l'e-mail.
create or replace function public.attach_school_from_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
  v_school uuid;
begin
  if new.school_id is not null then
    return new;
  end if;

  select lower(split_part(u.email, '@', 2)) into v_domain
  from auth.users u where u.id = new.id;

  if v_domain is null then
    return new;
  end if;

  select s.id into v_school
  from schools s
  where v_domain = any (s.email_domains) and s.active
  limit 1;

  new.school_id := v_school;
  return new;
end;
$$;

drop trigger if exists profiles_attach_school on profiles;
create trigger profiles_attach_school
  before insert on profiles
  for each row execute function public.attach_school_from_email();

-- 3. Les membres de mon ecole sont visibles -----------------------

drop policy if exists profiles_select_same_school on profiles;
create policy profiles_select_same_school on profiles
  for select to authenticated
  using (school_id is not null and school_id = public.my_school_id());

-- 4. La communaute se ferme a l'ecole -----------------------------

alter table posts add column if not exists school_id uuid references schools(id) on delete set null;
create index if not exists idx_posts_school on posts(school_id);

update posts p
set school_id = pr.school_id
from profiles pr
where p.school_id is null and pr.id = p.user_id;

create or replace function public.set_post_school()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.school_id is null then
    select school_id into new.school_id from profiles where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_set_school on posts;
create trigger posts_set_school
  before insert on posts
  for each row execute function public.set_post_school();

drop policy if exists posts_select on posts;
create policy posts_select on posts
  for select to authenticated
  using (school_id is not null and school_id = public.my_school_id());

drop policy if exists comments_select on comments;
create policy comments_select on comments
  for select to authenticated
  using (exists (
    select 1 from posts p
    where p.id = comments.post_id and p.school_id = public.my_school_id()
  ));

drop policy if exists post_likes_select on post_likes;
create policy post_likes_select on post_likes
  for select to authenticated
  using (exists (
    select 1 from posts p
    where p.id = post_likes.post_id and p.school_id = public.my_school_id()
  ));

-- 5. Import d'emploi du temps -------------------------------------
-- courses reste le catalogue des matieres et creneaux hebdomadaires
-- saisis a la main. timetable_events porte les seances datees issues
-- d'un agenda importe. Les deux coexistent.

create table if not exists timetable_sources (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text not null default 'Mon emploi du temps',
  kind         text not null default 'link' check (kind in ('link','file')),
  url          text,
  last_sync_at timestamptz,
  last_status  text,
  events_count integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_tt_sources_user on timetable_sources(user_id);

create table if not exists timetable_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  source_id    uuid references timetable_sources(id) on delete cascade,
  course_id    uuid references courses(id) on delete set null,
  title        text not null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  location     text,
  origin       text not null default 'manual' check (origin in ('manual','import')),
  external_uid text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_tt_events_user_start on timetable_events(user_id, starts_at);
create unique index if not exists idx_tt_events_uid
  on timetable_events(user_id, external_uid) where external_uid is not null;

do $$
declare t text;
begin
  foreach t in array array['timetable_sources','timetable_events'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "%s_select" on %I', t, t);
    execute format('create policy "%s_select" on %I for select to authenticated using (user_id = auth.uid())', t, t);
    execute format('drop policy if exists "%s_insert" on %I', t, t);
    execute format('create policy "%s_insert" on %I for insert to authenticated with check (user_id = auth.uid())', t, t);
    execute format('drop policy if exists "%s_update" on %I', t, t);
    execute format('create policy "%s_update" on %I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
    execute format('drop policy if exists "%s_delete" on %I', t, t);
    execute format('create policy "%s_delete" on %I for delete to authenticated using (user_id = auth.uid())', t, t);
  end loop;
end $$;
