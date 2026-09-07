import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";

/**
 * Les notifications de message privé.
 *
 * Trois choses à savoir avant de lire le code :
 *
 * 1. Ça ne fonctionne pas dans Expo Go. Depuis le SDK 53, les notifications
 *    distantes demandent un build de développement. Le code ci-dessous le
 *    détecte et renvoie un message clair plutôt qu'une erreur technique.
 * 2. Il faut un identifiant de projet EAS, produit par `eas init`. Sans lui,
 *    Expo ne sait pas à quelle application envoyer.
 * 3. C'est l'app de l'expéditeur qui déclenche l'envoi, juste après le
 *    message. Un téléphone coupé dans la seconde qui suit ne déclenche rien.
 *    Le message part quand même : c'est le prévenu qui saute, pas le contenu.
 */

/** Une notification reçue app ouverte s'affiche quand même, en bandeau. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CANAL = "messages";

function identifiantProjet(): string | null {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

/** Vrai si l'appareil peut recevoir des notifications distantes. */
export function appareilCompatible(): boolean {
  return Device.isDevice && Constants.appOwnership !== "expo";
}

async function jetonDeCetAppareil(): Promise<string | null> {
  const projet = identifiantProjet();
  if (!projet) return null;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: projet });
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Demande l'autorisation et enregistre l'appareil.
 * Renvoie true si tout s'est bien passé, lève une erreur explicite sinon.
 */
export async function activerNotifications(): Promise<void> {
  if (!Device.isDevice) {
    throw new Error("Les notifications ne fonctionnent pas sur un simulateur.");
  }
  if (Constants.appOwnership === "expo") {
    throw new Error(
      "Les notifications ne fonctionnent pas dans Expo Go. Il faut un build de développement.",
    );
  }
  if (!identifiantProjet()) {
    throw new Error(
      "Le projet n'est pas encore relié à EAS. Lance `eas init` une fois, puis réessaie.",
    );
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: "Messages privés",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2F5FB5",
    });
  }

  const existante = await Notifications.getPermissionsAsync();
  let accordee = existante.granted;
  if (!accordee) {
    const demande = await Notifications.requestPermissionsAsync();
    accordee = demande.granted;
  }
  if (!accordee) {
    throw new Error(
      "Les notifications sont refusées. Autorise-les dans les réglages de ton téléphone.",
    );
  }

  const jeton = await jetonDeCetAppareil();
  if (!jeton) throw new Error("Le jeton de notification n'a pas pu être obtenu.");

  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Aucune session active.");

  // Le jeton est unique : un appareil qui change de compte bascule sur le
  // nouveau plutôt que d'apparaître deux fois.
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: data.user.id,
      token: jeton,
      plateforme: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );
  if (error) throw error;
}

export async function desactiverNotifications(): Promise<void> {
  const jeton = await jetonDeCetAppareil();
  if (jeton) {
    const { error } = await supabase.from("push_tokens").delete().eq("token", jeton);
    if (error) throw error;
    return;
  }
  // Sans jeton lisible, on retire tous les appareils du compte : mieux vaut
  // en désactiver un de trop que de laisser l'étudiant sans interrupteur.
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("push_tokens").delete().eq("user_id", data.user.id);
}

/** L'appareil courant est-il enregistré ? Ne demande jamais l'autorisation. */
export async function notificationsActives(): Promise<boolean> {
  if (!appareilCompatible() || !identifiantProjet()) return false;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return false;
  const jeton = await jetonDeCetAppareil();
  if (!jeton) return false;
  const { data } = await supabase
    .from("push_tokens")
    .select("id")
    .eq("token", jeton)
    .maybeSingle();
  return !!data;
}

/**
 * Demande à la fonction serveur de prévenir le destinataire.
 * Ne lève jamais : un message parti ne doit pas paraître échoué parce que la
 * notification n'est pas partie.
 */
export async function prevenirDunMessage(conversationId: string): Promise<void> {
  try {
    await supabase.functions.invoke("notifier-message", {
      body: { conversation_id: conversationId },
    });
  } catch {
    // silence volontaire
  }
}
