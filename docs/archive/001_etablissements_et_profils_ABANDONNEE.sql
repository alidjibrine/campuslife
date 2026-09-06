-- ============================================================
-- CAMPUSLIFE - Migration 001 : etablissements et profils
-- Correspond au lot 1 du programme de dev.
-- ============================================================
-- Principe : un etudiant appartient a un etablissement, et cet
-- etablissement conditionne tout ce qu'il voit du cote social.
-- Le rattachement se fait par le domaine de son adresse e-mail.
-- ============================================================

-- 1. Referentiel des etablissements -------------------------------

create table if not exists etablissements (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null,
  nom_court     text,
  ville         text not null,
  type          text not null default 'universite'
                check (type in ('universite','ecole','iut','bts','autre')),
  domaines      text[] not null default '{}',  -- ex : {etu.unistra.fr, unistra.fr}
  actif         boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_etab_domaines on etablissements using gin (domaines);

alter table etablissements enable row level security;

-- Le referentiel est public en lecture : il faut pouvoir choisir son ecole
-- avant meme d'avoir un profil complet.
drop policy if exists "etablissements lisibles par tous" on etablissements;
create policy "etablissements lisibles par tous"
  on etablissements for select
  to authenticated
  using (actif = true);

-- 2. Profils ------------------------------------------------------

create table if not exists profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  prenom             text,
  nom                text,
  avatar_url         text,
  etablissement_id   uuid references etablissements(id) on delete set null,
  annee_etude        text,   -- ex : L3, M1
  filiere            text,
  bio                text,
  stockage_octets    bigint not null default 0,   -- quota : voir regle 6 du CLAUDE.md
  onboarding_fait    boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table profiles enable row level security;

-- Chacun lit et modifie son propre profil.
drop policy if exists "je lis mon profil" on profiles;
create policy "je lis mon profil"
  on profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "je modifie mon profil" on profiles;
create policy "je modifie mon profil"
  on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "je cree mon profil" on profiles;
create policy "je cree mon profil"
  on profiles for insert to authenticated
  with check (id = auth.uid());

-- Les membres du meme etablissement voient les profils entre eux.
-- C'est ce qui rend la partie sociale possible sans ouvrir a toute la France.
drop policy if exists "je vois les profils de mon etablissement" on profiles;
create policy "je vois les profils de mon etablissement"
  on profiles for select to authenticated
  using (
    etablissement_id is not null
    and etablissement_id = (select p.etablissement_id from profiles p where p.id = auth.uid())
  );

-- 3. Creation automatique du profil a l'inscription ---------------
-- Le domaine de l'adresse e-mail sert a rattacher l'etudiant a son ecole.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domaine text;
  v_etab    uuid;
begin
  v_domaine := lower(split_part(new.email, '@', 2));

  select e.id into v_etab
  from etablissements e
  where v_domaine = any (e.domaines) and e.actif
  limit 1;

  insert into public.profiles (id, etablissement_id)
  values (new.id, v_etab)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. updated_at ---------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function public.touch_updated_at();

-- 5. Amorce : premier etablissement -------------------------------
-- On lance sur Strasbourg. Les autres viendront un par un.

insert into etablissements (nom, nom_court, ville, type, domaines)
values
  ('Universite de Strasbourg', 'Unistra', 'Strasbourg', 'universite',
   '{etu.unistra.fr,unistra.fr}')
on conflict do nothing;
