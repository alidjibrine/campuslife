-- 007_quota_et_suppression.sql
-- Lot 7 : ce qui separe un projet perso d'une app qu'on donne a des inconnus.
-- Deux sujets : le stockage, qui coute de l'argent et n'avait aucune limite,
-- et la suppression de compte, qui laissait des fichiers derriere elle.

-- 1. Limites par fichier, posees au niveau du seau ------------------------------
-- Sans ces limites, un seul compte pouvait televerser un fichier de plusieurs
-- gigaoctets. Le seau avatars n'accepte plus que des images.

update storage.buckets
   set file_size_limit = 2 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'avatars';

update storage.buckets
   set file_size_limit = 10 * 1024 * 1024
 where id = 'documents';

-- 2. Quota total par compte -----------------------------------------------------
-- Les regles d'acces du stockage rangent les fichiers dans un dossier portant
-- l'identifiant du compte. On additionne donc par dossier, ce qui reste juste
-- meme si la colonne owner a ete videe entre temps.

create or replace function public.quota_stockage()
returns bigint
language sql
immutable
as $$
  select (50 * 1024 * 1024)::bigint;
$$;

create or replace function public.stockage_utilise(compte uuid default auth.uid())
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum((o.metadata ->> 'size')::bigint), 0)
    from storage.objects o
   where (storage.foldername(o.name))[1] = compte::text;
$$;

revoke execute on function public.stockage_utilise(uuid) from public, anon;
revoke execute on function public.quota_stockage() from public, anon;
grant execute on function public.stockage_utilise(uuid) to authenticated;
grant execute on function public.quota_stockage() to authenticated;

-- Regle restrictive : elle s'ajoute aux regles existantes par un ET, la ou une
-- regle permissive de plus n'aurait rien limite du tout.
-- Le controle porte sur l'occupation avant ecriture, le depassement maximum est
-- donc d'un fichier, soit 10 Mo. C'est assume : la limite par fichier ci-dessus
-- borne le debordement.

drop policy if exists "Quota de stockage par compte" on storage.objects;
create policy "Quota de stockage par compte" on storage.objects
  as restrictive
  for insert
  to authenticated
  with check (public.stockage_utilise(auth.uid()) < public.quota_stockage());

-- 3. Suppression de compte ------------------------------------------------------
-- La version de juin etait deja solide : toutes les cles etrangeres vers
-- auth.users sont en ON DELETE CASCADE, donc les tables ajoutees depuis
-- (emploi du temps, signalements, vues de profil) partaient deja. Il manquait
-- deux choses : les signalements qui visent le compte, et les fichiers.
--
-- Attention : supprimer les lignes de storage.objects retire la reference mais
-- pas le fichier lui-meme du stockage objet. L'application efface donc d'abord
-- les fichiers par l'API de stockage, et cette fonction ne fait que le menage
-- de secours.

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

  -- Signalements deposes par le compte et signalements qui le visent
  delete from public.reports where reporter_id = uid;
  delete from public.reports where target_id = uid;

  -- Fichiers : menage de secours, l'app doit avoir fait le vrai effacement
  delete from storage.objects where (storage.foldername(name))[1] = uid::text;

  -- Contenus. Les cascades feraient le travail, on reste explicite pour que
  -- la lecture de cette fonction suffise a savoir ce qui disparait.
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
