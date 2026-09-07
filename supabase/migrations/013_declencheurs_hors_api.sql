-- 013_declencheurs_hors_api.sql
--
-- PostgREST expose toute fonction du schema public, declencheurs compris.
-- La migration 006 les avait retires un par un ; depuis, les migrations 010 et
-- 011 en ont ajoute deux nouveaux, et l'analyseur de securite les a signales.
--
-- Plutot que de refaire la liste a chaque fois, on retire le droit d'execution
-- de toutes les fonctions qui renvoient un declencheur. Elles ne sont jamais
-- appelees directement : les declencheurs, eux, continuent de fonctionner.

do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as signature
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.signature);
  end loop;
end;
$$;
