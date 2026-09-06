import { supabase } from "@/lib/supabase";

/**
 * Les messages prives.
 *
 * Une conversation relie exactement deux etudiants de la meme ecole. Cette
 * regle n'est pas verifiee ici mais en base : la fonction ouvrir_conversation
 * refuse deux etablissements differents, et les regles d'acces empechent de
 * lire une conversation dont on n'est pas membre. L'app se contente d'afficher.
 */

export type Conversation = {
  id: string;
  autreId: string;
  autreNom: string | null;
  autreFiliere: string | null;
  autreAvatar: string | null;
  dernierMessage: string | null;
  dernierLe: Date;
  nonLus: number;
};

export type Message = {
  id: string;
  auteurId: string;
  contenu: string;
  creeLe: Date;
  cestMoi: boolean;
};

const PLAFOND_CARACTERES = 2000;

async function moi(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Aucune session active.");
  return data.user.id;
}

/** Mes conversations, la plus recente en premier, avec le compteur de non lus. */
export async function listerConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc("mes_conversations");
  if (error) throw error;
  const lignes = (data ?? []) as Array<Record<string, unknown>>;
  return lignes.map((l) => ({
    id: String(l.id),
    autreId: String(l.autre_id),
    autreNom: (l.autre_nom as string | null) ?? null,
    autreFiliere: (l.autre_filiere as string | null) ?? null,
    autreAvatar: (l.autre_avatar as string | null) ?? null,
    dernierMessage: (l.dernier_message as string | null) ?? null,
    dernierLe: new Date(String(l.dernier_at)),
    nonLus: Number(l.non_lus ?? 0),
  }));
}

/**
 * Ouvre la conversation avec quelqu'un, ou retrouve celle qui existe deja.
 * Renvoie son identifiant. Deux appels de suite donnent le meme resultat.
 */
export async function ouvrirConversation(autreId: string): Promise<string> {
  const { data, error } = await supabase.rpc("ouvrir_conversation", { autre: autreId });
  if (error) throw error;
  if (!data) throw new Error("La conversation n'a pas pu être ouverte.");
  return String(data);
}

function versMessage(ligne: Record<string, unknown>, monId: string): Message {
  const auteurId = String(ligne.sender_id);
  return {
    id: String(ligne.id),
    auteurId,
    contenu: String(ligne.content ?? ""),
    creeLe: new Date(String(ligne.created_at)),
    cestMoi: auteurId === monId,
  };
}

/** Les messages d'une conversation, du plus ancien au plus recent. */
export async function listerMessages(conversationId: string): Promise<Message[]> {
  const monId = await moi();
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) throw error;
  return (data ?? []).map((l) => versMessage(l as Record<string, unknown>, monId));
}

export async function envoyer(conversationId: string, contenu: string): Promise<Message> {
  const texte = contenu.trim();
  if (!texte) throw new Error("Le message est vide.");
  if (texte.length > PLAFOND_CARACTERES) {
    throw new Error("Message trop long, " + PLAFOND_CARACTERES + " caractères maximum.");
  }
  const monId = await moi();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: monId, content: texte })
    .select("id, sender_id, content, created_at")
    .single();
  if (error) throw error;
  return versMessage(data as Record<string, unknown>, monId);
}

export async function supprimerMessage(id: string): Promise<void> {
  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) throw error;
}

/** Remet le compteur de non lus a zero pour moi sur cette conversation. */
export async function marquerLu(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc("marquer_lu", { conv: conversationId });
  if (error) throw error;
}

/**
 * Ecoute les nouveaux messages de la conversation en direct.
 * Renvoie la fonction a appeler pour couper l'ecoute quand on quitte l'ecran :
 * l'oublier laisse un canal ouvert et l'app finit par en accumuler.
 */
export function ecouterMessages(
  conversationId: string,
  monId: string,
  auMessage: (m: Message) => void,
): () => void {
  const canal = supabase
    .channel("conversation:" + conversationId)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "conversation_id=eq." + conversationId,
      },
      (charge: { new: Record<string, unknown> }) => {
        auMessage(versMessage(charge.new, monId));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}

export async function monIdentifiant(): Promise<string> {
  return moi();
}

export function formaterHeure(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function memeJour(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "Aujourd'hui", "Hier", sinon la date en clair. Sert de separateur de jour. */
export function libelleJour(date: Date): string {
  const maintenant = new Date();
  if (memeJour(date, maintenant)) return "Aujourd'hui";
  const hier = new Date(maintenant);
  hier.setDate(hier.getDate() - 1);
  if (memeJour(date, hier)) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Vrai si ce message ouvre un nouveau jour dans la liste. */
export function changeDeJour(message: Message, precedent: Message | undefined): boolean {
  if (!precedent) return true;
  return !memeJour(message.creeLe, precedent.creeLe);
}
