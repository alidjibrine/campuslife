import { supabase } from "@/lib/supabase";

/**
 * La communaute d'etablissement.
 *
 * Regle absolue, posee au cadrage et appliquee en base : un etudiant ne voit
 * que sa propre ecole. Ce fichier ne filtre rien lui-meme, ce sont les regles
 * d'acces de la base qui s'en chargent. Si elles tombent, l'app ne rattrape
 * pas le coup, c'est voulu : la securite ne doit pas dependre de l'affichage.
 */

export const CATEGORIES = ["Entraide", "Bon plan", "Événement", "Question"] as const;
export type Categorie = (typeof CATEGORIES)[number];

export const MOTIFS_SIGNALEMENT = [
  { cle: "spam", libelle: "Spam ou publicité" },
  { cle: "harcelement", libelle: "Harcèlement" },
  { cle: "choquant", libelle: "Contenu choquant" },
  { cle: "fausse_info", libelle: "Fausse information" },
  { cle: "autre", libelle: "Autre" },
] as const;

export type Publication = {
  id: string;
  auteurId: string;
  auteurNom: string;
  categorie: string | null;
  contenu: string;
  creeLe: Date;
  jaime: number;
  aimeParMoi: boolean;
  commentaires: number;
  cestMoi: boolean;
};

export type Commentaire = {
  id: string;
  auteurId: string;
  auteurNom: string;
  contenu: string;
  creeLe: Date;
  cestMoi: boolean;
};

export type Membre = {
  id: string;
  prenom: string | null;
  nom: string | null;
  anneeEtude: string | null;
  filiere: string | null;
  suivi: boolean;
  cestMoi: boolean;
};

async function moi(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Aucune session active.");
  return data.user.id;
}

async function monNomAffiche(): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", await moi())
    .maybeSingle();
  const prenom = (data?.first_name as string) ?? "";
  const nom = (data?.last_name as string) ?? "";
  return (prenom + " " + nom).trim() || "Étudiant";
}

function compte(valeur: unknown): number {
  if (Array.isArray(valeur) && valeur.length > 0) {
    return Number((valeur[0] as { count?: number }).count ?? 0);
  }
  return 0;
}

export async function listerPublications(): Promise<Publication[]> {
  const utilisateur = await moi();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, user_id, author_name, category, content, created_at, post_likes(count), comments(count)",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const { data: mesJaime } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", utilisateur);
  const aimes = new Set((mesJaime ?? []).map((l) => l.post_id as string));

  return (data ?? []).map((l) => ({
    id: l.id as string,
    auteurId: l.user_id as string,
    auteurNom: (l.author_name as string) ?? "Étudiant",
    categorie: (l.category as string) ?? null,
    contenu: l.content as string,
    creeLe: new Date(l.created_at as string),
    jaime: compte(l.post_likes),
    aimeParMoi: aimes.has(l.id as string),
    commentaires: compte(l.comments),
    cestMoi: (l.user_id as string) === utilisateur,
  }));
}

export async function publier(categorie: string, contenu: string): Promise<void> {
  const { error } = await supabase.from("posts").insert({
    user_id: await moi(),
    author_name: await monNomAffiche(),
    category: categorie,
    content: contenu.trim(),
  });
  if (error) throw error;
}

export async function supprimerPublication(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function basculerJaime(
  publicationId: string,
  dejaAime: boolean,
): Promise<void> {
  const utilisateur = await moi();
  if (dejaAime) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", publicationId)
      .eq("user_id", utilisateur);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: publicationId, user_id: utilisateur });
    if (error) throw error;
  }
}

export async function listerCommentaires(
  publicationId: string,
): Promise<Commentaire[]> {
  const utilisateur = await moi();
  const { data, error } = await supabase
    .from("comments")
    .select("id, user_id, author_name, content, created_at")
    .eq("post_id", publicationId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    auteurId: l.user_id as string,
    auteurNom: (l.author_name as string) ?? "Étudiant",
    contenu: l.content as string,
    creeLe: new Date(l.created_at as string),
    cestMoi: (l.user_id as string) === utilisateur,
  }));
}

export async function commenter(
  publicationId: string,
  contenu: string,
): Promise<void> {
  const { error } = await supabase.from("comments").insert({
    post_id: publicationId,
    user_id: await moi(),
    author_name: await monNomAffiche(),
    content: contenu.trim(),
  });
  if (error) throw error;
}

export async function supprimerCommentaire(id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

export async function listerMembres(): Promise<Membre[]> {
  const utilisateur = await moi();

  // Les regles d'acces ne renvoient que les profils de mon etablissement.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, year, field")
    .order("first_name");
  if (error) throw error;

  const { data: mesAbonnements } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", utilisateur);
  const suivis = new Set((mesAbonnements ?? []).map((l) => l.following_id as string));

  return (data ?? []).map((l) => ({
    id: l.id as string,
    prenom: (l.first_name as string) ?? null,
    nom: (l.last_name as string) ?? null,
    anneeEtude: (l.year as string) ?? null,
    filiere: (l.field as string) ?? null,
    suivi: suivis.has(l.id as string),
    cestMoi: (l.id as string) === utilisateur,
  }));
}

export async function basculerAbonnement(
  membreId: string,
  dejaSuivi: boolean,
): Promise<void> {
  const utilisateur = await moi();
  if (dejaSuivi) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", utilisateur)
      .eq("following_id", membreId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: utilisateur, following_id: membreId });
    if (error) throw error;
  }
}

export async function signaler(
  cible: "post" | "comment" | "profile",
  cibleId: string,
  motif: string,
  detail?: string,
): Promise<void> {
  const { error } = await supabase.from("reports").insert({
    reporter_id: await moi(),
    target_type: cible,
    target_id: cibleId,
    reason: motif,
    detail: detail ?? null,
  });
  if (error) {
    // L'index d'unicite empeche de signaler deux fois la meme chose.
    if (String(error.message).includes("duplicate")) {
      throw new Error("Tu as déjà signalé ce contenu.");
    }
    throw error;
  }
}

/** "il y a 3 h", "hier", "le 12 septembre" */
export function depuis(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return "il y a " + minutes + " min";
  const heures = Math.round(minutes / 60);
  if (heures < 24) return "il y a " + heures + " h";
  const jours = Math.round(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return "il y a " + jours + " jours";
  return "le " + date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}
