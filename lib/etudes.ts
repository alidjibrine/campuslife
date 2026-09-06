import { supabase } from "@/lib/supabase";

/**
 * Le module Etudes : cours, devoirs, notes.
 *
 * Les tables viennent de juin 2026 et sont en anglais. Comme pour le profil,
 * la traduction se fait ici : les ecrans ne manipulent que du francais.
 *
 * Convention des jours, heritee des donnees existantes : 1 = lundi, 7 = dimanche.
 */

export const JOURS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

export type Cours = {
  id: string;
  intitule: string;
  jour: number;
  debut: string;
  fin: string;
  salle: string | null;
};

export type Devoir = {
  id: string;
  titre: string;
  matiere: string | null;
  echeance: string | null;
  fait: boolean;
};

export type Note = {
  id: string;
  intitule: string;
  matiere: string | null;
  valeur: number;
  bareme: number;
  coefficient: number;
  date: string;
};

async function idUtilisateur(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Aucune session active.");
  return data.user.id;
}

// ---------- Cours ----------

export async function listerCours(): Promise<Cours[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, day, start_time, end_time, location")
    .order("day")
    .order("start_time");
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    intitule: l.title as string,
    jour: Number(l.day),
    debut: (l.start_time as string) ?? "",
    fin: (l.end_time as string) ?? "",
    salle: (l.location as string) ?? null,
  }));
}

export async function creerCours(c: {
  intitule: string;
  jour: number;
  debut: string;
  fin: string;
  salle: string | null;
}): Promise<void> {
  const { error } = await supabase.from("courses").insert({
    user_id: await idUtilisateur(),
    title: c.intitule.trim(),
    day: c.jour,
    start_time: c.debut.trim(),
    end_time: c.fin.trim(),
    location: c.salle?.trim() || null,
  });
  if (error) throw error;
}

export async function supprimerCours(id: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Devoirs ----------

export async function listerDevoirs(): Promise<Devoir[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, done")
    .order("done")
    .order("due_date", { nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    titre: l.title as string,
    matiere: (l.subject as string) ?? null,
    echeance: (l.due_date as string) ?? null,
    fait: Boolean(l.done),
  }));
}

export async function creerDevoir(d: {
  titre: string;
  matiere: string | null;
  echeance: string | null;
}): Promise<void> {
  const { error } = await supabase.from("assignments").insert({
    user_id: await idUtilisateur(),
    title: d.titre.trim(),
    subject: d.matiere?.trim() || null,
    due_date: d.echeance,
    done: false,
  });
  if (error) throw error;
}

export async function basculerDevoir(id: string, fait: boolean): Promise<void> {
  const { error } = await supabase
    .from("assignments")
    .update({ done: fait })
    .eq("id", id);
  if (error) throw error;
}

export async function supprimerDevoir(id: string): Promise<void> {
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Notes ----------

export async function listerNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("grades")
    .select("id, title, subject, score, max_score, coefficient, date")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    intitule: l.title as string,
    matiere: (l.subject as string) ?? null,
    valeur: Number(l.score),
    bareme: Number(l.max_score) || 20,
    coefficient: Number(l.coefficient) || 1,
    date: (l.date as string) ?? "",
  }));
}

export async function creerNote(n: {
  intitule: string;
  matiere: string | null;
  valeur: number;
  bareme: number;
  coefficient: number;
}): Promise<void> {
  const { error } = await supabase.from("grades").insert({
    user_id: await idUtilisateur(),
    title: n.intitule.trim(),
    subject: n.matiere?.trim() || null,
    score: n.valeur,
    max_score: n.bareme,
    coefficient: n.coefficient,
    date: new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
}

export async function supprimerNote(id: string): Promise<void> {
  const { error } = await supabase.from("grades").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Moyenne ramenee sur 20, ponderee par les coefficients.
 * Une note sur 40 avec coefficient 2 pese donc ce qu'elle doit peser.
 */
export function moyenne(notes: Note[]): number | null {
  const valides = notes.filter((n) => n.bareme > 0 && n.coefficient > 0);
  if (valides.length === 0) return null;
  const total = valides.reduce(
    (acc, n) => acc + (n.valeur / n.bareme) * 20 * n.coefficient,
    0,
  );
  const poids = valides.reduce((acc, n) => acc + n.coefficient, 0);
  return total / poids;
}

/** Moyenne par matiere, triee par ordre alphabetique. */
export function moyenneParMatiere(
  notes: Note[],
): { matiere: string; moyenne: number; nombre: number }[] {
  const groupes = new Map<string, Note[]>();
  for (const n of notes) {
    const cle = n.matiere ?? "Sans matière";
    groupes.set(cle, [...(groupes.get(cle) ?? []), n]);
  }
  return [...groupes.entries()]
    .map(([matiere, liste]) => ({
      matiere,
      moyenne: moyenne(liste) ?? 0,
      nombre: liste.length,
    }))
    .sort((a, b) => a.matiere.localeCompare(b.matiere));
}

/** "2026-09-12" devient "sam. 12 sept." */
export function formaterDate(iso: string | null): string {
  if (!iso) return "sans échéance";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Nombre de jours entre aujourd'hui et l'echeance. Negatif si depasse. */
export function joursRestants(iso: string | null): number | null {
  if (!iso) return null;
  const cible = new Date(iso + "T12:00:00");
  if (Number.isNaN(cible.getTime())) return null;
  const aujourdhui = new Date();
  aujourdhui.setHours(12, 0, 0, 0);
  return Math.round((cible.getTime() - aujourdhui.getTime()) / 86400000);
}
