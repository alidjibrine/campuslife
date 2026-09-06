-- 011_ecole_verrouillee.sql
--
-- Le trou le plus serieux qui restait, et il etait signale en commentaire dans
-- app/(app)/onboarding.tsx depuis le lot 1 : "A durcir avant l'ouverture au
-- public". Ca n'avait pas ete fait.
--
-- Quand la detection automatique echouait, l'onboarding laissait l'etudiant
-- choisir son etablissement dans une liste, et cette valeur partait telle
-- quelle dans profiles.school_id. Or la regle de mise a jour du profil autorise
-- chacun a modifier sa propre ligne sans controle sur cette colonne. N'importe
-- qui, avec n'importe quelle adresse, pouvait donc se declarer a l'Universite
-- de Strasbourg et acceder au fil, a l'annuaire et a la messagerie de tous ses
-- etudiants. Toute la regle de communaute fermee tombait sur ce seul champ.
--
-- Desormais le rattachement ne depend que du domaine de l'adresse, verifie en
-- base a chaque ecriture.

create or replace function public.ecole_du_courriel(compte uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id
    from auth.users u
    join public.schools s
      on lower(split_part(u.email, '@', 2)) = any (s.email_domains)
   where u.id = compte and s.active
   limit 1;
$$;

revoke execute on function public.ecole_du_courriel(uuid) from public, anon, authenticated;

create or replace function public.protect_school_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  attendue uuid;
begin
  -- Hors session : tableau de bord, migrations, declencheur d'inscription.
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.school_id is not distinct from old.school_id then
    return new;
  end if;

  if new.school_id is null then
    return new;
  end if;

  attendue := public.ecole_du_courriel(new.id);
  if attendue is null or new.school_id <> attendue then
    raise exception 'Le rattachement a un etablissement depend de ton adresse universitaire';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_school_id on public.profiles;
create trigger trg_protect_school_id
  before insert or update on public.profiles
  for each row execute function public.protect_school_id();

-- Une ecole ajoutee apres l'inscription ne rattache pas les comptes existants.
-- Cette fonction permet a l'etudiant de redemander la verification depuis l'app
-- au lieu d'avoir a recreer son compte.
create or replace function public.rattacher_mon_ecole()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  moi uuid := auth.uid();
  ecole uuid;
begin
  if moi is null then
    raise exception 'Non connecte';
  end if;
  ecole := public.ecole_du_courriel(moi);
  if ecole is null then
    return null;
  end if;
  update public.profiles set school_id = ecole where id = moi;
  return ecole;
end;
$$;

revoke execute on function public.rattacher_mon_ecole() from public, anon;
grant execute on function public.rattacher_mon_ecole() to authenticated;
