import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";
import { decoderBase64 } from "@/lib/base64";
import { placeDisponible } from "@/lib/compte";

/**
 * La photo de profil.
 *
 * Trois précautions avant l'envoi, dans cet ordre :
 *   1. la photo est recadrée en carré puis réduite à 512 pixels de côté,
 *      parce qu'une photo de téléphone pèse quatre mégaoctets et que le seau
 *      en refuse deux ;
 *   2. la place restante est vérifiée, pour donner un message clair plutôt
 *      qu'une erreur technique de la base ;
 *   3. le fichier est écrit sous « identifiant du compte / avatar.jpg », le
 *      seul chemin que les règles d'accès du stockage autorisent.
 *
 * Le seau des avatars est public : l'adresse de la photo est accessible à qui
 * la possède, sans être connecté. C'est écrit dans la politique de
 * confidentialité. L'adresse contient un identifiant aléatoire, elle ne se
 * devine pas, mais elle se partage.
 */

const SEAU = "avatars";
const COTE = 512;
const NOM = "avatar.jpg";
const PLAFOND = 2 * 1024 * 1024;

async function moi(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Aucune session active.");
  return data.user.id;
}

/**
 * Ouvre la galerie, laisse recadrer, envoie. Renvoie la nouvelle adresse,
 * ou null si l'étudiant a refermé le sélecteur sans rien choisir.
 */
export async function choisirEtTeleverserAvatar(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      "CampusLife n'a pas accès à tes photos. Autorise-le dans les réglages de ton téléphone.",
    );
  }

  const choix = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (choix.canceled || !choix.assets || choix.assets.length === 0) return null;

  return televerser(choix.assets[0].uri);
}

async function televerser(uri: string): Promise<string> {
  const image = await manipulateAsync(uri, [{ resize: { width: COTE } }], {
    compress: 0.75,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!image.base64) throw new Error("La photo n'a pas pu être préparée.");

  const octets = decoderBase64(image.base64);
  if (octets.length > PLAFOND) {
    throw new Error("Cette photo reste trop lourde après réduction. Essaie-en une autre.");
  }
  await placeDisponible(octets.length);

  const compte = await moi();
  const chemin = compte + "/" + NOM;

  const { error } = await supabase.storage.from(SEAU).upload(chemin, octets, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;

  // Le suffixe force le téléphone à recharger l'image : sans lui, l'ancienne
  // photo reste affichée, l'adresse n'ayant pas changé.
  const { data } = supabase.storage.from(SEAU).getPublicUrl(chemin);
  const adresse = data.publicUrl + "?v=" + Date.now();

  const { error: erreurProfil } = await supabase
    .from("profiles")
    .update({ avatar_url: adresse })
    .eq("id", compte);
  if (erreurProfil) throw erreurProfil;

  return adresse;
}

export async function retirerAvatar(): Promise<void> {
  const compte = await moi();
  const { error } = await supabase.storage.from(SEAU).remove([compte + "/" + NOM]);
  if (error) throw error;

  const { error: erreurProfil } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", compte);
  if (erreurProfil) throw erreurProfil;
}
