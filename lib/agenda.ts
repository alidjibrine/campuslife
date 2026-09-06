import { supabase } from "@/lib/supabase";
import { analyserIcs, normaliserUrl } from "@/lib/ics";

/**
 * Emploi du temps importe.
 *
 * Une source, c'est un lien d'agenda universitaire ou un fichier depose.
 * A chaque synchronisation, les seances de cette source sont remplacees en
 * bloc : c'est plus simple et plus sur que de reconcilier ligne a ligne, et
 * ca garantit qu'un creneau supprime a l'universite disparait aussi ici.
 */

export type SourceAgenda = {
  id: string;
  libelle: string;
  type: "lien" | "fichier";
  url: string | null;
  derniereSynchro: string | null;
  dernierStatut: string | null;
  nombreSeances: number;
};

export type Seance = {
  id: string;
  intitule: string;
  debut: Date;
  fin: Date;
  salle: string | null;
  origine: "manuel" | "import";
};

async function idUtilisateur(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Aucune session active.");
  return data.user.id;
}

export async function listerSources(): Promise<SourceAgenda[]> {
  const { data, error } = await supabase
    .from("timetable_sources")
    .select("id, label, kind, url, last_sync_at, last_status, events_count")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    libelle: (l.label as string) ?? "Mon emploi du temps",
    type: (l.kind as string) === "file" ? "fichier" : "lien",
    url: (l.url as string) ?? null,
    derniereSynchro: (l.last_sync_at as string) ?? null,
    dernierStatut: (l.last_status as string) ?? null,
    nombreSeances: Number(l.events_count ?? 0),
  }));
}

export async function ajouterSourceLien(
  url: string,
  libelle: string,
): Promise<SourceAgenda> {
  const { data, error } = await supabase
    .from("timetable_sources")
    .insert({
      user_id: await idUtilisateur(),
      label: libelle.trim() || "Mon emploi du temps",
      kind: "link",
      url: normaliserUrl(url),
    })
    .select("id, label, kind, url, last_sync_at, last_status, events_count")
    .single();
  if (error) throw error;
  return {
    id: data.id as string,
    libelle: data.label as string,
    type: "lien",
    url: data.url as string,
    derniereSynchro: null,
    dernierStatut: null,
    nombreSeances: 0,
  };
}

export async function supprimerSource(id: string): Promise<void> {
  // Les seances partent avec, grace au on delete cascade.
  const { error } = await supabase.from("timetable_sources").delete().eq("id", id);
  if (error) throw error;
}

/** Telecharge le lien puis remplace les seances de la source. */
export async function synchroniser(source: SourceAgenda): Promise<number> {
  if (!source.url) {
    throw new Error("Cette source n'a pas de lien a telecharger.");
  }
  let texte: string;
  try {
    const reponse = await fetch(normaliserUrl(source.url), {
      headers: { Accept: "text/calendar, text/plain, */*" },
    });
    if (!reponse.ok) {
      throw new Error("Le serveur a repondu " + reponse.status + ".");
    }
    texte = await reponse.text();
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    await noterStatut(source.id, "Echec : " + detail);
    throw new Error(
      "Impossible de telecharger l'agenda. " +
        detail +
        " Verifie que le lien est public et qu'il se termine par .ics.",
    );
  }
  return remplacerSeances(source.id, texte);
}

/** Remplace toutes les seances d'une source a partir d'un contenu iCalendar. */
export async function remplacerSeances(
  sourceId: string,
  texte: string,
): Promise<number> {
  const evenements = analyserIcs(texte);
  if (evenements.length === 0) {
    await noterStatut(sourceId, "Aucune seance trouvee");
    throw new Error(
      "Aucune seance trouvee. Le lien ne pointe peut-etre pas vers un agenda au format .ics.",
    );
  }

  const utilisateur = await idUtilisateur();

  // Deux seances ne peuvent pas partager le meme identifiant externe.
  const vus = new Set<string>();
  const lignes = evenements
    .filter((e) => {
      if (!e.uid) return true;
      if (vus.has(e.uid)) return false;
      vus.add(e.uid);
      return true;
    })
    .map((e) => ({
      user_id: utilisateur,
      source_id: sourceId,
      title: e.intitule,
      starts_at: e.debut.toISOString(),
      ends_at: e.fin.toISOString(),
      location: e.lieu,
      origin: "import",
      external_uid: e.uid,
    }));

  const { error: erreurSuppression } = await supabase
    .from("timetable_events")
    .delete()
    .eq("source_id", sourceId);
  if (erreurSuppression) throw erreurSuppression;

  for (let i = 0; i < lignes.length; i += 200) {
    const { error } = await supabase
      .from("timetable_events")
      .insert(lignes.slice(i, i + 200));
    if (error) throw error;
  }

  await supabase
    .from("timetable_sources")
    .update({
      last_sync_at: new Date().toISOString(),
      last_status: "ok",
      events_count: lignes.length,
    })
    .eq("id", sourceId);

  return lignes.length;
}

async function noterStatut(sourceId: string, statut: string): Promise<void> {
  await supabase
    .from("timetable_sources")
    .update({ last_sync_at: new Date().toISOString(), last_status: statut })
    .eq("id", sourceId);
}

/** Les seances comprises entre deux dates, triees. */
export async function listerSeances(du: Date, au: Date): Promise<Seance[]> {
  const { data, error } = await supabase
    .from("timetable_events")
    .select("id, title, starts_at, ends_at, location, origin")
    .gte("starts_at", du.toISOString())
    .lte("starts_at", au.toISOString())
    .order("starts_at");
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    intitule: l.title as string,
    debut: new Date(l.starts_at as string),
    fin: new Date(l.ends_at as string),
    salle: (l.location as string) ?? null,
    origine: (l.origin as "manuel" | "import") ?? "import",
  }));
}

/** Debut du lundi de la semaine contenant la date donnee. */
export function debutDeSemaine(date: Date): Date {
  const d = new Date(date);
  const decalage = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - decalage);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formaterHeure(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formaterJourLong(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
