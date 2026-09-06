-- 009_stockage_sans_parametre.sql
-- Deux finitions sur la 007.
--
-- 1. stockage_utilise acceptait un identifiant de compte en parametre. Comme
--    elle est SECURITY DEFINER, n'importe quel connecte pouvait demander
--    l'occupation d'un autre compte. Peu grave mais inutile : la fonction ne
--    repond plus que pour l'appelant.
-- 2. quota_stockage n'avait pas de search_path fixe.

drop policy if exists "Quota de stockage par compte" on storage.objects;
drop function if exists public.stockage_utilise(uuid);

create or replace function public.stockage_utilise()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum((o.metadata ->> 'size')::bigint), 0)
    from storage.objects o
   where (storage.foldername(o.name))[1] = auth.uid()::text;
$$;

revoke execute on function public.stockage_utilise() from public, anon;
grant execute on function public.stockage_utilise() to authenticated;

alter function public.quota_stockage() set search_path = public;

create policy "Quota de stockage par compte" on storage.objects
  as restrictive
  for insert
  to authenticated
  with check (public.stockage_utilise() < public.quota_stockage());
