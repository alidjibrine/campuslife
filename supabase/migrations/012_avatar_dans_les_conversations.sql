-- 012_avatar_dans_les_conversations.sql
-- La liste des conversations renvoie desormais la photo de l'interlocuteur,
-- pour que la messagerie affiche les memes visages que le reste de l'app.
-- Le type de retour change, il faut donc supprimer la fonction avant de la
-- recreer : create or replace ne sait pas modifier une colonne de sortie.

drop function if exists public.mes_conversations();

create or replace function public.mes_conversations()
returns table (
  id uuid,
  autre_id uuid,
  autre_nom text,
  autre_filiere text,
  autre_avatar text,
  dernier_message text,
  dernier_at timestamptz,
  non_lus integer
)
language sql
security definer
set search_path = public
as $$
  select c.id,
         p.id,
         nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
         p.field,
         p.avatar_url,
         c.last_message,
         c.last_at,
         (select count(*)
            from public.messages m
           where m.conversation_id = c.id
             and m.sender_id <> auth.uid()
             and m.created_at > coalesce(
                   case when c.user_a = auth.uid() then c.a_last_read_at else c.b_last_read_at end,
                   '-infinity'::timestamptz))::int
    from public.conversations c
    join public.profiles p
      on p.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
   where c.user_a = auth.uid() or c.user_b = auth.uid()
   order by c.last_at desc;
$$;

revoke execute on function public.mes_conversations() from public, anon;
grant execute on function public.mes_conversations() to authenticated;
