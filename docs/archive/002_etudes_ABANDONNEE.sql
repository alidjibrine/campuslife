-- ============================================================
-- CAMPUSLIFE - Migration 002 : le module Etudes
-- Correspond aux lots 2 et 3 du programme de dev.
-- ============================================================
-- Tout ce qui est ici est strictement prive : un etudiant ne voit
-- que ses propres cours, seances, devoirs et notes. Aucune exception.
-- ============================================================

-- 1. Cours --------------------------------------------------------

create table if not exists cours (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  intitule    text not null,
  code        text,
  enseignant  text,
  couleur     text not null default '#378ADD',
  archive     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_cours_user on cours(user_id);

-- 2. Sources d'agenda (le lien ADE ou Celcat, ou un fichier .ics) --

create table if not exists sources_agenda (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  libelle           text not null default 'Mon emploi du temps',
  type              text not null default 'lien'
                    check (type in ('lien','fichier')),
  url               text,
  derniere_synchro  timestamptz,
  dernier_statut    text,           -- 'ok' ou le message d'erreur
  nb_seances        integer not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists idx_sources_user on sources_agenda(user_id);

-- 3. Seances (les cases de l'emploi du temps) ---------------------

create table if not exists seances (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  cours_id     uuid references cours(id) on delete set null,
  source_id    uuid references sources_agenda(id) on delete cascade,
  intitule     text not null,
  debut        timestamptz not null,
  fin          timestamptz not null,
  salle        text,
  origine      text not null default 'manuel' check (origine in ('manuel','import')),
  uid_externe  text,      -- l'UID du VEVENT, pour ne pas creer de doublon
  created_at   timestamptz not null default now()
);
create index if not exists idx_seances_user_debut on seances(user_id, debut);
create unique index if not exists idx_seances_uid
  on seances(user_id, uid_externe) where uid_externe is not null;

-- 4. Devoirs ------------------------------------------------------

create table if not exists devoirs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  cours_id    uuid references cours(id) on delete set null,
  titre       text not null,
  detail      text,
  echeance    timestamptz,
  statut      text not null default 'a_faire' check (statut in ('a_faire','fait')),
  priorite    smallint not null default 1 check (priorite between 0 and 2),
  fait_le     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_devoirs_user_echeance on devoirs(user_id, echeance);

-- 5. Notes --------------------------------------------------------

create table if not exists notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  cours_id     uuid references cours(id) on delete set null,
  intitule     text not null,
  valeur       numeric(5,2) not null,
  bareme       numeric(5,2) not null default 20,
  coefficient  numeric(5,2) not null default 1,
  date_eval    date not null default current_date,
  created_at   timestamptz not null default now()
);
create index if not exists idx_notes_user on notes(user_id);

-- 6. Regles d'acces : tout est prive ------------------------------
-- Une seule regle, appliquee a l'identique aux cinq tables.

do $$
declare t text;
begin
  foreach t in array array['cours','sources_agenda','seances','devoirs','notes'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "prive : lecture" on %I', t);
    execute format('create policy "prive : lecture" on %I for select to authenticated using (user_id = auth.uid())', t);
    execute format('drop policy if exists "prive : ecriture" on %I', t);
    execute format('create policy "prive : ecriture" on %I for insert to authenticated with check (user_id = auth.uid())', t);
    execute format('drop policy if exists "prive : modification" on %I', t);
    execute format('create policy "prive : modification" on %I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('drop policy if exists "prive : suppression" on %I', t);
    execute format('create policy "prive : suppression" on %I for delete to authenticated using (user_id = auth.uid())', t);
  end loop;
end $$;
