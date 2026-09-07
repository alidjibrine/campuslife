import { supabase } from "@/lib/supabase";

/**
 * Le budget.
 *
 * Les tables viennent de juin 2026, avec leurs règles d'accès : une dépense
 * n'est lisible que par celui qui l'a saisie, sans exception et sans partage.
 *
 * Convention de signe, choisie ici une bonne fois : **un montant positif est
 * une dépense, un montant négatif est une rentrée** (bourse, virement, vente).
 * C'est contre-intuitif comptablement, mais un étudiant qui ouvre l'app saisit
 * une dépense neuf fois sur dix, et il ne doit pas avoir à taper un signe moins
 * neuf fois sur dix.
 */

export const CATEGORIES_BUDGET = [
  "Courses",
  "Logement",
  "Transport",
  "Sorties",
  "Études",
  "Santé",
  "Autre",
] as const;

export type Depense = {
  id: string;
  montant: number;
  categorie: string | null;
  note: string | null;
  date: string;
};

export type Enveloppe = {
  id: string;
  categorie: string;
  plafond: number;
};

export type Reglages = {
  budgetMensuel: number | null;
  seuilAlerte: number;
  seuilDanger: number;
};

export type LigneCategorie = {
  categorie: string;
  depense: number;
  plafond: number | null;
  part: number;
};

async function idUtilisateur(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Aucune session active.");
  return data.user.id;
}

// ---------- Bornes du mois ----------

export function debutDuMois(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function finDuMois(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function iso(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function libelleMois(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// ---------- Dépenses ----------

export async function listerDepenses(mois: Date): Promise<Depense[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, category, note, date")
    .gte("date", iso(debutDuMois(mois)))
    .lte("date", iso(finDuMois(mois)))
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    montant: Number(l.amount),
    categorie: (l.category as string) ?? null,
    note: (l.note as string) ?? null,
    date: (l.date as string) ?? "",
  }));
}

export async function creerDepense(d: {
  montant: number;
  categorie: string | null;
  note: string | null;
  date: string;
}): Promise<void> {
  const { error } = await supabase.from("transactions").insert({
    user_id: await idUtilisateur(),
    amount: d.montant,
    category: d.categorie,
    note: d.note?.trim() || null,
    date: d.date,
  });
  if (error) throw error;
}

export async function modifierDepense(
  id: string,
  d: { montant: number; categorie: string | null; note: string | null; date: string },
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .update({
      amount: d.montant,
      category: d.categorie,
      note: d.note?.trim() || null,
      date: d.date,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function supprimerDepense(id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Enveloppes par catégorie ----------

export async function listerEnveloppes(): Promise<Enveloppe[]> {
  const { data, error } = await supabase
    .from("category_budgets")
    .select("id, category, monthly_limit")
    .order("category");
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    categorie: l.category as string,
    plafond: Number(l.monthly_limit),
  }));
}

/** Pose ou remplace le plafond mensuel d'une catégorie. Zéro le retire. */
export async function definirEnveloppe(categorie: string, plafond: number): Promise<void> {
  const compte = await idUtilisateur();

  if (plafond <= 0) {
    const { error } = await supabase
      .from("category_budgets")
      .delete()
      .eq("user_id", compte)
      .eq("category", categorie);
    if (error) throw error;
    return;
  }

  const existante = await supabase
    .from("category_budgets")
    .select("id")
    .eq("user_id", compte)
    .eq("category", categorie)
    .maybeSingle();

  if (existante.data?.id) {
    const { error } = await supabase
      .from("category_budgets")
      .update({ monthly_limit: plafond, updated_at: new Date().toISOString() })
      .eq("id", existante.data.id as string);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("category_budgets")
    .insert({ user_id: compte, category: categorie, monthly_limit: plafond });
  if (error) throw error;
}

// ---------- Réglages généraux ----------

export async function lireReglages(): Promise<Reglages> {
  const { data, error } = await supabase
    .from("profiles")
    .select("monthly_budget, budget_warn_pct, budget_danger_pct")
    .eq("id", await idUtilisateur())
    .maybeSingle();
  if (error) throw error;
  const brut = data?.monthly_budget;
  return {
    budgetMensuel: brut === null || brut === undefined ? null : Number(brut),
    seuilAlerte: Number(data?.budget_warn_pct ?? 75),
    seuilDanger: Number(data?.budget_danger_pct ?? 100),
  };
}

export async function definirBudgetMensuel(montant: number | null): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ monthly_budget: montant })
    .eq("id", await idUtilisateur());
  if (error) throw error;
}

// ---------- Calculs ----------

/** Somme des dépenses, les rentrées exclues. */
export function totalDepense(depenses: Depense[]): number {
  return depenses.filter((d) => d.montant > 0).reduce((s, d) => s + d.montant, 0);
}

/** Somme des rentrées, en valeur positive. */
export function totalRentrees(depenses: Depense[]): number {
  return depenses.filter((d) => d.montant < 0).reduce((s, d) => s - d.montant, 0);
}

/**
 * Une ligne par catégorie ayant une dépense ou un plafond, la plus grosse
 * dépense en premier. Une enveloppe fixée mais jamais utilisée reste visible :
 * c'est justement l'information utile.
 */
export function parCategorie(
  depenses: Depense[],
  enveloppes: Enveloppe[],
): LigneCategorie[] {
  const totaux = new Map<string, number>();
  for (const d of depenses) {
    if (d.montant <= 0) continue;
    const cle = d.categorie ?? "Autre";
    totaux.set(cle, (totaux.get(cle) ?? 0) + d.montant);
  }
  for (const e of enveloppes) {
    if (!totaux.has(e.categorie)) totaux.set(e.categorie, 0);
  }

  const total = totalDepense(depenses);
  return [...totaux.entries()]
    .map(([categorie, depense]) => ({
      categorie,
      depense,
      plafond: enveloppes.find((e) => e.categorie === categorie)?.plafond ?? null,
      part: total > 0 ? depense / total : 0,
    }))
    .sort((a, b) => b.depense - a.depense);
}

export function formaterEuros(montant: number): string {
  const arrondi = Math.round(montant * 100) / 100;
  const texte = Number.isInteger(arrondi)
    ? String(arrondi)
    : arrondi.toFixed(2).replace(".", ",");
  return texte + " €";
}

/** "2026-09-12" devient "sam. 12". Le mois est déjà dans le titre. */
export function formaterJour(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}
