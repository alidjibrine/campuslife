import { supabase } from "@/lib/supabase";
import { MOTIFS_SIGNALEMENT } from "@/lib/communaute";

/**
 * La moderation.
 *
 * Un moderateur ne l'est que pour son etablissement, et le role ne se donne pas
 * depuis l'application : un declencheur en base refuse toute modification de la
 * colonne role tant qu'une session est active. Il se pose depuis le tableau de
 * bord Supabase, volontairement.
 */

export type Decision = "traite" | "rejete";

export type Signalement = {
  id: string;
  creeLe: Date;
  motif: string;
  motifLibelle: string;
  detail: string | null;
  statut: "nouveau" | "traite" | "rejete";
  cibleType: "post" | "comment" | "profile";
  cibleId: string;
  contenu: string | null;
  auteurNom: string | null;
  auteurId: string | null;
  existe: boolean;
};

const LIBELLES: Record<string, string> = Object.fromEntries(
  MOTIFS_SIGNALEMENT.map((m) => [m.cle, m.libelle]),
);

export function libelleCible(type: string): string {
  if (type === "post") return "Publication";
  if (type === "comment") return "Réponse";
  if (type === "profile") return "Profil";
  return "Contenu";
}

export async function suisJeModerateur(): Promise<boolean> {
  const { data, error } = await supabase.rpc("est_moderateur");
  if (error) return false;
  return data === true;
}

export async function listerSignalements(): Promise<Signalement[]> {
  const { data, error } = await supabase.rpc("signalements_a_traiter");
  if (error) throw error;
  const lignes = (data ?? []) as Array<Record<string, unknown>>;
  return lignes.map((l) => {
    const motif = String(l.motif ?? "");
    return {
      id: String(l.id),
      creeLe: new Date(String(l.cree_le)),
      motif,
      motifLibelle: LIBELLES[motif] ?? motif,
      detail: (l.detail as string | null) ?? null,
      statut: (l.statut as Signalement["statut"]) ?? "nouveau",
      cibleType: (l.cible_type as Signalement["cibleType"]) ?? "post",
      cibleId: String(l.cible_id),
      contenu: (l.contenu as string | null) ?? null,
      auteurNom: (l.auteur_nom as string | null) ?? null,
      auteurId: (l.auteur_id as string | null) ?? null,
      existe: l.existe === true,
    };
  });
}

/**
 * Classe un signalement. `supprimer` efface le contenu vise, avec ses reponses
 * et ses mentions j'aime. Tous les signalements portant sur le meme contenu
 * sont classes en meme temps.
 */
export async function traiter(
  id: string,
  decision: Decision,
  supprimer = false,
): Promise<void> {
  const { error } = await supabase.rpc("traiter_signalement", {
    signalement: id,
    decision,
    supprimer,
  });
  if (error) throw error;
}
