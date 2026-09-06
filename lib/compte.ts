import { supabase } from "@/lib/supabase";

/**
 * Le compte : ce qu'il occupe, et comment le faire disparaitre.
 *
 * Point important sur la suppression : la base de donnees ne peut pas effacer
 * les fichiers elle-meme, Supabase interdit la suppression directe dans les
 * tables de stockage. Les fichiers sont donc effaces ici, par l'API de
 * stockage, AVANT l'appel a la fonction de suppression. Si cet effacement
 * echoue, on s'arrete : mieux vaut un compte encore vivant que des fichiers
 * orphelins derriere un compte disparu.
 */

const SEAUX = ["avatars", "documents"] as const;

export type Stockage = {
  utilise: number;
  quota: number;
  pourcentage: number;
};

export async function stockage(): Promise<Stockage> {
  const [occupe, limite] = await Promise.all([
    supabase.rpc("stockage_utilise"),
    supabase.rpc("quota_stockage"),
  ]);
  if (occupe.error) throw occupe.error;
  if (limite.error) throw limite.error;

  const utilise = Number(occupe.data ?? 0);
  const quota = Number(limite.data ?? 0);
  return {
    utilise,
    quota,
    pourcentage: quota > 0 ? Math.min(100, Math.round((utilise / quota) * 100)) : 0,
  };
}

export function formaterOctets(octets: number): string {
  if (octets < 1024) return octets + " o";
  if (octets < 1024 * 1024) return Math.round(octets / 1024) + " Ko";
  const mo = octets / (1024 * 1024);
  return (mo < 10 ? mo.toFixed(1) : Math.round(mo).toString()) + " Mo";
}

/**
 * Verifie qu'il reste de la place avant de televerser un fichier.
 * A appeler avant toute ecriture de fichier, la base refusera de toute facon
 * mais un refus explique vaut mieux qu'une erreur technique.
 */
export async function placeDisponible(tailleVoulue: number): Promise<void> {
  const etat = await stockage();
  if (etat.utilise >= etat.quota) {
    throw new Error(
      "Ton espace de stockage est plein (" +
        formaterOctets(etat.quota) +
        "). Supprime des fichiers avant d'en ajouter.",
    );
  }
  if (etat.utilise + tailleVoulue > etat.quota) {
    throw new Error(
      "Ce fichier ne rentre pas. Il te reste " +
        formaterOctets(etat.quota - etat.utilise) +
        ".",
    );
  }
}

/** Efface les fichiers du compte dans les deux seaux. */
async function effacerMesFichiers(compte: string): Promise<void> {
  for (const seau of SEAUX) {
    const { data, error } = await supabase.storage
      .from(seau)
      .list(compte, { limit: 1000 });
    if (error) throw error;

    const chemins = (data ?? [])
      .filter((f) => !!f.name)
      .map((f) => compte + "/" + f.name);
    if (chemins.length === 0) continue;

    const { error: erreurSuppression } = await supabase.storage
      .from(seau)
      .remove(chemins);
    if (erreurSuppression) throw erreurSuppression;
  }
}

/**
 * Supprime definitivement le compte et tout ce qui s'y rattache.
 * Irreversible. Les conversations privees partent en entier, messages de
 * l'autre personne compris.
 */
export async function supprimerMonCompte(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const compte = data.user?.id;
  if (!compte) throw new Error("Aucune session active.");

  await effacerMesFichiers(compte);

  const { error } = await supabase.rpc("delete_account");
  if (error) throw error;

  await supabase.auth.signOut();
}
