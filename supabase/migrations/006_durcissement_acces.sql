-- 006_durcissement_acces.sql
-- Correction de trois faiblesses reperees par l'analyseur de securite Supabase
-- apres la migration 005.

-- 1. La faille serieuse : la vue public_profiles ---------------------------------
-- Heritee de juin. Elle expose prenom, nom, bio, ecole, filiere et annee de TOUS
-- les profils, sans regle d'acces (SECURITY DEFINER) et avec le role anon parmi
-- les beneficiaires. Autrement dit : n'importe qui possedant la cle publique de
-- l'app, qui est dans le paquet installe sur les telephones, pouvait lire
-- l'annuaire complet de tous les etablissements sans meme se connecter. Cela
-- annulait la regle de communaute fermee posee au lot 5.
-- On la repasse en SECURITY INVOKER : elle applique desormais les regles d'acces
-- de celui qui la lit, donc la meme ecole que lui. Et on retire anon.

alter view public.public_profiles set (security_invoker = on);

revoke all on public.public_profiles from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.public_profiles from authenticated;

-- 2. search_path fixe sur la fonction ajoutee en 005 -----------------------------

alter function public.protect_conversation_participants() set search_path = public;

-- 3. Les fonctions de declencheur ne sont pas des points d'entree API -------------
-- PostgREST expose toute fonction du schema public. Une fonction de declencheur
-- appelee directement echoue, mais elle n'a rien a faire dans l'API : on retire
-- le droit d'execution. Les declencheurs, eux, continuent de fonctionner.

revoke execute on function public.set_conversation_school() from public, anon, authenticated;
revoke execute on function public.touch_conversation() from public, anon, authenticated;
revoke execute on function public.protect_conversation_participants() from public, anon, authenticated;
revoke execute on function public.set_post_school() from public, anon, authenticated;
revoke execute on function public.set_report_school() from public, anon, authenticated;
revoke execute on function public.attach_school_from_email() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 4. Les fonctions metier restent reservees aux connectes -------------------------

revoke execute on function public.ouvrir_conversation(uuid) from public, anon;
revoke execute on function public.mes_conversations() from public, anon;
revoke execute on function public.marquer_lu(uuid) from public, anon;
revoke execute on function public.my_school_id() from public, anon;

grant execute on function public.ouvrir_conversation(uuid) to authenticated;
grant execute on function public.mes_conversations() to authenticated;
grant execute on function public.marquer_lu(uuid) to authenticated;
grant execute on function public.my_school_id() to authenticated;
