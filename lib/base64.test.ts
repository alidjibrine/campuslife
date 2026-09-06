import { decoderBase64 } from "./base64";

declare const process: { exit(code: number): void };

let ok = 0;
let ko = 0;

function verifier(nom: string, condition: boolean) {
  if (condition) {
    ok += 1;
    console.log("  OK  " + nom);
  } else {
    ko += 1;
    console.log("  KO  " + nom);
  }
}

function versTexte(o: Uint8Array): string {
  return Array.from(o)
    .map((c) => String.fromCharCode(c))
    .join("");
}

verifier("chaine vide", decoderBase64("").length === 0);
verifier("un octet", versTexte(decoderBase64("QQ==")) === "A");
verifier("deux octets", versTexte(decoderBase64("QUI=")) === "AB");
verifier("trois octets", versTexte(decoderBase64("QUJD")) === "ABC");
verifier("Hello", versTexte(decoderBase64("SGVsbG8=")) === "Hello");
verifier(
  "phrase complete",
  versTexte(decoderBase64("Q2FtcHVzTGlmZQ==")) === "CampusLife",
);
verifier("sans remplissage", versTexte(decoderBase64("SGVsbG8")) === "Hello");
verifier(
  "retours a la ligne ignores",
  versTexte(decoderBase64("SGVs\nbG8=")) === "Hello",
);
verifier("prefixe data: retire", versTexte(decoderBase64("data:image/jpeg;base64,QUJD")) === "ABC");

// Octets binaires : les valeurs hautes ne doivent pas etre tronquees.
const binaire = decoderBase64("//79");
verifier("octet 255", binaire[0] === 255);
verifier("octet 254", binaire[1] === 254);
verifier("octet 253", binaire[2] === 253);

// Un aller-retour sur 256 valeurs, encodees a la main.
function encoder(octets: number[]): string {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let sortie = "";
  for (let i = 0; i < octets.length; i += 3) {
    const a = octets[i];
    const b = octets[i + 1];
    const c = octets[i + 2];
    sortie += A[a >> 2];
    sortie += A[((a & 3) << 4) | (b === undefined ? 0 : b >> 4)];
    sortie += b === undefined ? "=" : A[((b & 15) << 2) | (c === undefined ? 0 : c >> 6)];
    sortie += c === undefined ? "=" : A[c & 63];
  }
  return sortie;
}

const toutes = Array.from({ length: 256 }, (_, i) => i);
const retour = decoderBase64(encoder(toutes));
verifier("aller-retour sur 256 octets, longueur", retour.length === 256);
verifier(
  "aller-retour sur 256 octets, contenu",
  toutes.every((v, i) => retour[i] === v),
);

console.log("");
console.log(ok + " tests OK, " + ko + " KO");
process.exit(ko === 0 ? 0 : 1);
