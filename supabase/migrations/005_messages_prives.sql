-- 005_messages_prives.sql
-- Lot 6 : messages prives.
-- Les tables conversations et messages existent depuis juin avec leurs policies
-- participants. Cette migration ajoute ce qui manquait : le cloisonnement par
-- etablissement, le suivi de lecture, l'unicite de la paire, le realtime et les
-- fonctions d'ouverture / listage.

-- 1. Cloisonnement par etablissement -----------------------------------------

alter table public.conversations
  add column if not exists school_id uuid references public.schools(id);

create or replace function public.set_conversation_school()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ecole_a uuid;
  ecole_b uuid;
begin
  select school_id into ecole_a from public.profiles where id = new.user_a;
  select school_id into ecole_b from public.profiles where id = new.user_b;
  if ecole_a is null or ecole_b is null or ecole_a is distinct from ecole_b then
    raise exception 'Les deux membres doivent appartenir au meme etablissement';
  end if;
  new.school_id := ecole_a;
  return new;
end;
$$;

drop trigger if exists trg_set_conversation_school on public.conversations;
create trigger trg_set_conversation_school
  before insert on public.conversations
  for each row execute function public.set_conversation_school();

-- 2. On ne change pas les participants apres coup ----------------------------

create or replace function public.protect_conversation_participants()
returns trigger
language plpgsql
as $$
begin
  if new.user_a is distinct from old.user_a
     or new.user_b is distinct from old.user_b
     or new.school_id is distinct from old.school_id then
    raise exception 'Les participants d une conversation ne peuvent pas etre modifies';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_conversation_participants on public.conversations;
create trigger trg_protect_conversation_participants
  before update on public.conversations
  for each row execute function public.protect_conversation_participants();

-- 3. Suivi de lecture ---------------------------------------------------------

alter table public.conversations
  add column if not exists a_last_read_at timestamptz;
alter table public.conversations
  add column if not exists b_last_read_at timestamptz;

-- 4. Une seule conversation par paire, quel que soit l ordre -------------------

alter table public.conversations
  drop constraint if exists conversations_paire_ordonnee;
alter table public.conversations
  add constraint conversations_paire_ordonnee check (user_a < user_b);

-- 5. Un membre peut supprimer son propre message -------------------------------

drop policy if exists msg_delete on public.messages;
create policy msg_delete on public.messages
  for delete using (sender_id = auth.uid());

-- 6. La conversation remonte quand un message arrive ---------------------------

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message = left(new.content, 200),
         last_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation on public.messages;
create trigger trg_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- 7. Ouvrir (ou retrouver) une conversation ------------------------------------

create or replace function public.ouvrir_conversation(autre uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  moi uuid := auth.uid();
  a uuid;
  b uuid;
  conv uuid;
  nom_a text;
  nom_b text;
begin
  if moi is null then
    raise exception 'Non connecte';
  end if;
  if autre is null or autre = moi then
    raise exception 'Destinataire invalide';
  end if;

  a := least(moi, autre);
  b := greatest(moi, autre);

  select id into conv from public.conversations where user_a = a and user_b = b;
  if conv is not null then
    return conv;
  end if;

  select nullif(btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')
    into nom_a from public.profiles where id = a;
  select nullif(btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')
    into nom_b from public.profiles where id = b;

  insert into public.conversations (user_a, user_b, a_name, b_name, last_at)
  values (a, b, nom_a, nom_b, now())
  returning id into conv;

  return conv;
end;
$$;

grant execute on function public.ouvrir_conversation(uuid) to authenticated;

-- 8. Mes conversations avec le compteur de non lus -----------------------------

create or replace function public.mes_conversations()
returns table (
  id uuid,
  autre_id uuid,
  autre_nom text,
  autre_filiere text,
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

grant execute on function public.mes_conversations() to authenticated;

-- 9. Marquer une conversation comme lue ----------------------------------------

create or replace function public.marquer_lu(conv uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set a_last_read_at = now()
   where id = conv and user_a = auth.uid();
  update public.conversations
     set b_last_read_at = now()
   where id = conv and user_b = auth.uid();
end;
$$;

grant execute on function public.marquer_lu(uuid) to authenticated;

-- 10. Realtime -----------------------------------------------------------------

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
