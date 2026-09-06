import { analyserIcs, normaliserUrl } from "./ics";

/**
 * Tests du lecteur iCalendar.
 *
 * A lancer avec :  npm run test:ics
 * Ce n'est pas un vrai cadre de test, c'est volontaire : le fichier tourne
 * avec node seul, sans dependance supplementaire a installer.
 */

let ok = 0;
let ko = 0;

function verifier(nom: string, condition: boolean, detail?: string) {
  if (condition) {
    ok += 1;
    console.log("  OK  " + nom);
  } else {
    ko += 1;
    console.log("  KO  " + nom + (detail ? "  -> " + detail : ""));
  }
}

// 1. Cas ADE classique : une seance, fuseau nomme, ligne repliee
const ade = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "UID:ADE60-2026-0912-001",
  "DTSTART;TZID=Europe/Paris:20260908T080000",
  "DTEND;TZID=Europe/Paris:20260908T100000",
  "SUMMARY:Droit civil - CM ",
  " (Amphi)",
  "LOCATION:Amphi Cavailles",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");
let r = analyserIcs(ade);
verifier("ADE : une seance lue", r.length === 1, "recu " + r.length);
verifier("ADE : debut a 8 h locales", r[0]?.debut.getHours() === 8);
verifier("ADE : duree de 2 h", r[0] && r[0].fin.getTime() - r[0].debut.getTime() === 7200000);
verifier("ADE : ligne repliee recollee", !!r[0]?.intitule.includes("(Amphi)"), r[0]?.intitule);
verifier("ADE : lieu lu", r[0]?.lieu === "Amphi Cavailles");
verifier("ADE : identifiant lu", r[0]?.uid === "ADE60-2026-0912-001");

// 2. Heures en UTC
r = analyserIcs(
  ["BEGIN:VEVENT", "UID:u1", "DTSTART:20260908T060000Z", "DTEND:20260908T080000Z", "SUMMARY:TD Anglais", "END:VEVENT"].join("\n"),
);
verifier("UTC : converti", r.length === 1 && r[0].debut.getUTCHours() === 6);

// 3. Recurrence hebdomadaire avec COUNT
r = analyserIcs(
  ["BEGIN:VEVENT", "UID:u2", "DTSTART:20260907T140000", "DTEND:20260907T160000", "RRULE:FREQ=WEEKLY;COUNT=4", "SUMMARY:Maths", "END:VEVENT"].join("\n"),
);
verifier("Hebdo COUNT=4 : quatre seances", r.length === 4, "recu " + r.length);
verifier("Hebdo : sept jours d'ecart", r.length === 4 && r[1].debut.getTime() - r[0].debut.getTime() === 7 * 86400000);
verifier("Hebdo : identifiants distincts", r.length === 4 && r[0].uid === "u2#0" && r[3].uid === "u2#3");

// 4. Recurrence avec BYDAY et UNTIL
r = analyserIcs(
  ["BEGIN:VEVENT", "UID:u3", "DTSTART:20260907T090000", "DTEND:20260907T103000", "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20260921T235900", "SUMMARY:Gestion", "END:VEVENT"].join("\n"),
);
verifier("BYDAY : cinq dates du 7 au 21 septembre", r.length === 5, "recu " + r.length);
verifier("BYDAY : duree conservee", r.length > 0 && r[0].fin.getTime() - r[0].debut.getTime() === 5400000);

// 5. Journee entiere
r = analyserIcs(["BEGIN:VEVENT", "UID:u4", "DTSTART;VALUE=DATE:20260910", "SUMMARY:Ferie", "END:VEVENT"].join("\n"));
verifier("Journee entiere : minuit local", r.length === 1 && r[0].debut.getHours() === 0);
verifier("Journee entiere : une heure par defaut", r.length === 1 && r[0].fin.getTime() - r[0].debut.getTime() === 3600000);

// 6. Echappements
r = analyserIcs(
  ["BEGIN:VEVENT", "UID:u5", "DTSTART:20260908T080000", "DTEND:20260908T090000", "SUMMARY:Droit\\, civil\\; TD\\nsalle 2", "END:VEVENT"].join("\n"),
);
verifier("Echappements nettoyes", r[0]?.intitule === "Droit, civil; TD salle 2", r[0]?.intitule);

// 7. Tri chronologique
r = analyserIcs(
  [
    "BEGIN:VEVENT", "UID:b", "DTSTART:20260910T080000", "DTEND:20260910T090000", "SUMMARY:B", "END:VEVENT",
    "BEGIN:VEVENT", "UID:a", "DTSTART:20260908T080000", "DTEND:20260908T090000", "SUMMARY:A", "END:VEVENT",
  ].join("\n"),
);
verifier("Tri chronologique", r.length === 2 && r[0].intitule === "A");

// 8. Entrees invalides
verifier("Texte vide : aucune seance", analyserIcs("").length === 0);
verifier("Texte quelconque : aucune seance", analyserIcs("bonjour").length === 0);

// 9. Plafond
const gros = ["BEGIN:VEVENT", "UID:g", "DTSTART:20260907T140000", "DTEND:20260907T150000", "RRULE:FREQ=WEEKLY;COUNT=300", "SUMMARY:Boucle", "END:VEVENT"].join("\n");
verifier("Plafond respecte", analyserIcs(gros, 50).length <= 50);

// 10. Normalisation des liens
verifier("webcal converti", normaliserUrl("webcal://ade.fr/x.ics") === "https://ade.fr/x.ics");
verifier("https ajoute", normaliserUrl("ade.fr/x.ics") === "https://ade.fr/x.ics");
verifier("https conserve", normaliserUrl(" https://ade.fr/x.ics ") === "https://ade.fr/x.ics");

console.log("\n" + ok + " tests OK, " + ko + " KO");

// Sortie en erreur si un test echoue, sans dependre des types de node.
declare const process: { exit(code: number): void };
process.exit(ko === 0 ? 0 : 1);
