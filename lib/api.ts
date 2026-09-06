import { supabase } from "@/lib/supabase";

/**
 * Acces aux donnees de CampusLife.
 *
 * Rappel : les tables et les colonnes sont en anglais, heritees de juin 2026.
 * Tout ce qui remonte dans l'app est traduit en francais ici, une bonne fois,
 * pour que les ecrans ne manipulent que du francais.
 */

export type Ecole = {
  id: string;
  nom: string;
  nomCourt: string | null;
  ville: string;
};

export type Profil = {
  id: string;
  email: string | null;
  prenom: string | null;
  nom: string | null;
  anneeEtude: string | null;
  filiere: string | null;
  ecoleId: string | null;
  ecole: Ecole | null;
  estComplet: boolean;
};

type LigneEcole = {
  id: string;
  name: string;
  short_name: string | null;
  city: string;
};

type LigneProfil = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  year: string | null;
  field: string | null;
  school_id: string | null;
  schools: LigneEcole | null;
};

function versEcole(ligne: LigneEcole | null | undefined): Ecole | null {
  if (!ligne) return null;
  return {
    id: ligne.id,
    nom: ligne.name,
    nomCourt: ligne.short_name,
    ville: ligne.city,
  };
}

function versProfil(ligne: LigneProfil): Profil {
  const prenom = ligne.first_name?.trim() || null;
  const nom = ligne.last_name?.trim() || null;
  const annee = ligne.year?.trim() || null;
  return {
    id: ligne.id,
    email: ligne.email,
    prenom,
    nom,
    anneeEtude: annee,
    filiere: ligne.field?.trim() || null,
    ecoleId: ligne.school_id,
    ecole: versEcole(ligne.schools),
    // Un profil est complet quand on sait qui il est, ou il en est,
    // et dans quelle ecole. Sans ecole, la communaute n'affiche rien.
    estComplet: Boolean(prenom && nom && annee && ligne.school_id),
  };
}

const CHAMPS_PROFIL =
  "id, email, first_name, last_name, year, field, school_id, schools (id, name, short_name, city)";

export async function getMonProfil(): Promise<Profil | null> {
  const { data: auth } = await supabase.auth.getUser();
  const utilisateur = auth.user;
  if (!utilisateur) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(CHAMPS_PROFIL)
    .eq("id", utilisateur.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return versProfil(data as unknown as LigneProfil);
}

export async function majMonProfil(champs: {
  prenom: string;
  nom: string;
  anneeEtude: string;
  filiere: string | null;
  ecoleId?: string | null;
}): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const utilisateur = auth.user;
  if (!utilisateur) throw new Error("Aucune session active.");

  const modifications: Record<string, unknown> = {
    first_name: champs.prenom.trim(),
    last_name: champs.nom.trim(),
    year: champs.anneeEtude.trim(),
    field: champs.filiere?.trim() || null,
  };

  // L'ecole n'est ecrite que si l'ecran la fournit : le rattachement
  // automatique par domaine e-mail ne doit pas etre ecrase par erreur.
  if (champs.ecoleId !== undefined) {
    modifications.school_id = champs.ecoleId;
  }

  // upsert plutot qu'update : si le declencheur d'inscription n'a pas cree
  // la ligne de profil, l'onboarding la cree au lieu de tourner en boucle.
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: utilisateur.id, ...modifications }, { onConflict: "id" });

  if (error) throw error;
}

export async function listerEcoles(): Promise<Ecole[]> {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, short_name, city")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return ((data ?? []) as LigneEcole[]).map((l) => versEcole(l) as Ecole);
}

export async function inscription(
  email: string,
  motDePasse: string,
): Promise<{ sessionCreee: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: motDePasse,
  });
  if (error) throw error;
  // Si la confirmation par e-mail est active cote Supabase, aucune session
  // n'est ouverte tant que l'etudiant n'a pas clique sur le lien recu.
  return { sessionCreee: Boolean(data.session) };
}

export async function connexion(email: string, motDePasse: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: motDePasse,
  });
  if (error) throw error;
}

/** Traduit les messages d'erreur de Supabase, qui arrivent en anglais. */
export function messageErreur(erreur: unknown): string {
  const brut = erreur instanceof Error ? erreur.message : String(erreur);
  const m = brut.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (m.includes("already registered")) {
    return "Un compte existe deja avec cette adresse. Connecte-toi.";
  }
  if (m.includes("password should be at least")) {
    return "Le mot de passe doit faire au moins 6 caracteres.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "Cette adresse e-mail n'est pas valide.";
  }
  if (m.includes("email not confirmed")) {
    return "Ton adresse n'est pas encore confirmee. Regarde ta boite mail.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Pas de reseau. Verifie ta connexion et reessaie.";
  }
  return brut;
}
