-- 008_suppression_sans_storage.sql
-- Correction de la 007.
--
-- La 007 ajoutait un menage de secours sur storage.objects dans delete_account.
-- Supabase interdit desormais la suppression directe dans les tables de
-- stockage : un declencheur leve "Direct deletion from storage tables is not
-- allowed. Use the Storage API instead.". Resultat, delete_account echouait
-- entierement, donc plus aucune suppression de compte possible. Repere par le
-- test de suppression avant toute mise en service.
--
-- L'effacement des fichiers se fait donc uniquement cote application, par
-- l'API de stockage, AVANT l'appel a cette fonction. Voir lib/compte.ts :
-- si l'effacement des fichiers echoue, le compte n'est pas supprime, pour ne
-- pas laisser de fichiers orphelins derriere un compte disparu.

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
