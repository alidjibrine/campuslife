-- ============================================================
-- CAMPUSLIFE - Migration 004 : signalements et abonnements
-- Appliquee le 6 septembre 2026.
-- ============================================================
-- Prepare le lot 5. Deux manques identifies au cadrage :
--   1. aucun moyen de signaler un contenu, alors que la communaute
--      s'ouvre des la premiere version
--   2. les abonnements traversaient encore les ecoles, contrairement
--      aux publications et aux commentaires
-- ============================================================

create table if not exists reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references auth.users(id) on delete cascade,
  school_id    uuid references schools(id) on delete set null,
  target_type  text not null check (target_type in ('post','comment','profile')),
  target_id    uuid not null,
  reason       text not null
               check (reason in ('spam','harcelement','choquant','fausse_info','autre')),
  detail       text,
  status       text not null default 'nouveau'
               check (status in ('nouveau','traite','rejete')),
  created_at   timestamptz not null default now(),
  handled_at   timestamptz
);

create index if not exists idx_reports_school_status on reports(school_id, status);
create unique index if not exists idx_reports_unicite
  on reports(reporter_id, target_type, target_id);

alter table reports enable row level security;

create or replace function public.set_report_school()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.school_id is null then
    select school_id into new.school_id from profiles where id = new.reporter_id;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_set_school on reports;
create trigger reports_set_school
  before insert on reports
  for each row execute function public.set_report_school();

drop policy if exists reports_insert on reports;
create policy reports_insert on reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists reports_select on reports;
create policy reports_select on reports
  for select to authenticated
  using (reporter_id = auth.uid());

drop policy if exists follows_select on follows;
create policy follows_select on follows
  for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = follows.following_id and p.school_id = public.my_school_id()
    )
    and exists (
      select 1 from profiles q
      where q.id = follows.follower_id and q.school_id = public.my_school_id()
    )
  );

drop policy if exists follows_insert on follows;
create policy follows_insert on follows
  for insert to authenticated
  with check (
    follower_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = following_id
        and p.school_id is not null
        and p.school_id = public.my_school_id()
    )
  );

drop policy if exists profile_views_select on profile_views;
create policy profile_views_select on profile_views
  for select to authenticated
  using (profile_id = auth.uid());
