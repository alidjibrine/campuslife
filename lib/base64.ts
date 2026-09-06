/**
 * Décodage base64 vers octets.
 *
 * Pourquoi écrire ça à la main plutôt que d'appeler `atob` : le moteur
 * JavaScript des téléphones ne le fournit pas de façon fiable selon les
 * versions, et `Buffer` n'existe pas non plus. Vingt lignes testées valent
 * mieux qu'une dépendance de plus, ou qu'un plantage sur un seul modèle.
 *
 * Sert à téléverser une photo : le sélecteur d'images la rend en base64, le
 * stockage Supabase attend des octets.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const TABLE: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i += 1) TABLE[ALPHABET[i]] = i;

export function decoderBase64(entree: string): Uint8Array {
  // On écarte tout ce qui n'est pas de l'alphabet : le remplissage « = »,
  // les retours à la ligne, les espaces, et l'éventuel préfixe data:.
  const propre = entree.includes(",") ? entree.slice(entree.indexOf(",") + 1) : entree;

  let accumulateur = 0;
  let bits = 0;
  let sortie = 0;
  const octets = new Uint8Array(Math.floor((propre.length * 3) / 4));

  for (let i = 0; i < propre.length; i += 1) {
    const valeur = TABLE[propre[i]];
    if (valeur === undefined) continue;
    accumulateur = (accumulateur << 6) | valeur;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      octets[sortie] = (accumulateur >> bits) & 0xff;
      sortie += 1;
    }
  }

  return sortie === octets.length ? octets : octets.slice(0, sortie);
}
