/**
 * Lecture d'un agenda au format iCalendar (.ics).
 *
 * Les emplois du temps universitaires francais sortent d'ADE ou de Celcat, qui
 * publient un lien d'agenda à synchroniser. Ce fichier lit ce flux et en tire
 * une liste de seances datees.
 *
 * Choix assumes :
 *   - une heure sans indication de fuseau est lue comme une heure locale du
 *     telephone. Pour un etudiant en France devant un emploi du temps francais,
 *     c'est le comportement attendu.
 *   - les recurrences gerees sont hebdomadaires et quotidiennes, avec INTERVAL,
 *     COUNT, UNTIL et BYDAY. Les autres sont ignorees : ADE et Celcat exportent
 *     de toute facon chaque seance separement dans l'immense majorite des cas.
 */

export type EvenementIcs = {
  uid: string | null;
  intitule: string;
  debut: Date;
  fin: Date;
  lieu: string | null;
};

const JOURS_ICS: Record<string, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 0,
};

/** Recolle les lignes repliees : une ligne qui commence par un espace continue la precedente. */
function deplier(texte: string): string[] {
  const brutes = texte.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lignes: string[] = [];
  for (const ligne of brutes) {
    if ((ligne.startsWith(" ") || ligne.startsWith("\t")) && lignes.length > 0) {
      lignes[lignes.length - 1] += ligne.slice(1);
    } else {
      lignes.push(ligne);
    }
  }
  return lignes;
}

/** "DTSTART;TZID=Europe/Paris:20260908T080000" devient nom, parametres et valeur. */
function decouper(ligne: string): {
  nom: string;
  params: Record<string, string>;
  valeur: string;
} | null {
  const sep = ligne.indexOf(":");
  if (sep === -1) return null;
  const gauche = ligne.slice(0, sep);
  const valeur = ligne.slice(sep + 1);
  const morceaux = gauche.split(";");
  const nom = morceaux[0].toUpperCase();
  const params: Record<string, string> = {};
  for (const p of morceaux.slice(1)) {
    const eq = p.indexOf("=");
    if (eq > 0) {
      params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, "");
    }
  }
  return { nom, params, valeur };
}

/** Retire les echappements du format : \n, \, \; et \\ */
function detexter(valeur: string): string {
  return valeur
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/**
 * Lit une date iCalendar.
 *   20260908           journee entiere, minuit local
 *   20260908T080000Z   heure UTC
 *   20260908T080000    heure locale (avec ou sans TZID)
 */
export function lireDate(valeur: string): Date | null {
  const v = valeur.trim();
  const jour = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (jour) {
    return new Date(Number(jour[1]), Number(jour[2]) - 1, Number(jour[3]), 0, 0, 0);
  }
  const complet = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!complet) return null;
  const [, a, mo, j, h, mi, s, z] = complet;
  if (z === "Z") {
    return new Date(
      Date.UTC(Number(a), Number(mo) - 1, Number(j), Number(h), Number(mi), Number(s)),
    );
  }
  return new Date(Number(a), Number(mo) - 1, Number(j), Number(h), Number(mi), Number(s));
}

/** Developpe une recurrence simple. Renvoie les dates de debut successives. */
function developper(
  regle: string,
  premierDebut: Date,
  plafond: number,
): Date[] {
  const parts: Record<string, string> = {};
  for (const morceau of regle.split(";")) {
    const eq = morceau.indexOf("=");
    if (eq > 0) parts[morceau.slice(0, eq).toUpperCase()] = morceau.slice(eq + 1);
  }

  const freq = (parts.FREQ ?? "").toUpperCase();
  if (freq !== "WEEKLY" && freq !== "DAILY") return [premierDebut];

  const intervalle = Math.max(1, Number(parts.INTERVAL ?? 1));
  const compte = parts.COUNT ? Number(parts.COUNT) : null;
  const jusqua = parts.UNTIL ? lireDate(parts.UNTIL) : null;

  const joursCibles =
    freq === "WEEKLY" && parts.BYDAY
      ? parts.BYDAY.split(",")
          .map((d) => JOURS_ICS[d.trim().slice(-2).toUpperCase()])
          .filter((n) => n !== undefined)
      : [premierDebut.getDay()];

  const dates: Date[] = [];
  const pasEnJours = freq === "DAILY" ? intervalle : 7 * intervalle;

  // Point de depart de la semaine du premier evenement.
  const curseur = new Date(premierDebut);
  let gardeFou = 0;

  while (dates.length < plafond && gardeFou < 400) {
    gardeFou += 1;

    if (freq === "DAILY") {
      if (jusqua && curseur > jusqua) break;
      if (curseur >= premierDebut) dates.push(new Date(curseur));
      curseur.setDate(curseur.getDate() + pasEnJours);
    } else {
      for (const jourCible of joursCibles) {
        const d = new Date(curseur);
        const ecart = (jourCible - curseur.getDay() + 7) % 7;
        d.setDate(d.getDate() + ecart);
        if (d < premierDebut) continue;
        if (jusqua && d > jusqua) continue;
        if (compte && dates.length >= compte) break;
        if (dates.length >= plafond) break;
        if (!dates.some((x) => x.getTime() === d.getTime())) dates.push(d);
      }
      if (jusqua && curseur > jusqua) break;
      curseur.setDate(curseur.getDate() + pasEnJours);
    }

    if (compte && dates.length >= compte) break;
  }

  dates.sort((a, b) => a.getTime() - b.getTime());
  return compte ? dates.slice(0, compte) : dates;
}

/**
 * Lit un fichier ou un flux iCalendar et renvoie les seances.
 * `plafond` limite le nombre total de seances produites, recurrences comprises.
 */
export function analyserIcs(texte: string, plafond = 800): EvenementIcs[] {
  const lignes = deplier(texte);
  const evenements: EvenementIcs[] = [];

  let dansEvenement = false;
  let courant: Record<string, string> = {};
  let paramsDebut: Record<string, string> = {};

  for (const ligne of lignes) {
    const nette = ligne.trim();
    if (nette.toUpperCase() === "BEGIN:VEVENT") {
      dansEvenement = true;
      courant = {};
      paramsDebut = {};
      continue;
    }
    if (nette.toUpperCase() === "END:VEVENT") {
      dansEvenement = false;
      const debut = courant.DTSTART ? lireDate(courant.DTSTART) : null;
      if (debut) {
        let fin = courant.DTEND ? lireDate(courant.DTEND) : null;
        if (!fin) {
          // Sans heure de fin, on considere une seance d'une heure.
          fin = new Date(debut.getTime() + 3600000);
        }
        const duree = Math.max(0, fin.getTime() - debut.getTime());
        const intitule = detexter(courant.SUMMARY ?? "Cours");
        const lieu = courant.LOCATION ? detexter(courant.LOCATION) : null;
        const uid = courant.UID ? courant.UID.trim() : null;

        const departs = courant.RRULE
          ? developper(courant.RRULE, debut, Math.max(1, plafond - evenements.length))
          : [debut];

        departs.forEach((d, index) => {
          if (evenements.length >= plafond) return;
          evenements.push({
            uid: uid ? (departs.length > 1 ? uid + "#" + index : uid) : null,
            intitule: intitule || "Cours",
            debut: d,
            fin: new Date(d.getTime() + duree),
            lieu: lieu || null,
          });
        });
      }
      continue;
    }
    if (!dansEvenement) continue;

    const decoupe = decouper(nette);
    if (!decoupe) continue;
    if (decoupe.nom === "DTSTART") paramsDebut = decoupe.params;
    courant[decoupe.nom] = decoupe.valeur;
  }

  // paramsDebut n'est pas utilise pour l'instant : les heures sans Z sont lues
  // en local, ce qui couvre les emplois du temps francais. Garde pour plus tard.
  void paramsDebut;

  evenements.sort((a, b) => a.debut.getTime() - b.debut.getTime());
  return evenements;
}

/** webcal://exemple.fr/x.ics devient https://exemple.fr/x.ics */
export function normaliserUrl(url: string): string {
  const u = url.trim();
  if (/^webcal:\/\//i.test(u)) return u.replace(/^webcal:\/\//i, "https://");
  if (!/^https?:\/\//i.test(u)) return "https://" + u;
  return u;
}
