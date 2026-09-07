import { useCallback, useEffect, useState } from "react";
import { Redirect, Stack, usePathname, useRouter, type Href } from "expo-router";
import * as Notifications from "expo-notifications";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { getMonProfil, type Profil } from "@/lib/api";
import { Colors } from "@/constants/theme";

/**
 * Ecrans reserves aux connectes.
 *
 * Trois gardes, dans cet ordre :
 *   1. pas de session, on renvoie vers la connexion
 *   2. session ouverte par un lien de reinitialisation, on renvoie vers le
 *      choix du nouveau mot de passe, avant meme l'onboarding
 *   3. profil incomplet, on renvoie vers l'onboarding
 *
 * Le profil est relu a chaque changement d'ecran : une fois l'onboarding
 * termine, la garde se leve toute seule sans avoir a recharger l'app.
 */
export default function AppLayout() {
  const { session, chargement: chargementAuth, modeRecuperation } = useAuth();
  const chemin = usePathname();
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [profilCharge, setProfilCharge] = useState(false);

  const charger = useCallback(async () => {
    try {
      setProfil(await getMonProfil());
    } catch {
      setProfil(null);
    } finally {
      setProfilCharge(true);
    }
  }, []);

  // Toucher une notification ouvre la conversation concernee. Sans ca, elle
  // ouvre l'app sur le QG et l'etudiant doit retrouver le message lui-meme.
  useEffect(() => {
    const ecoute = Notifications.addNotificationResponseReceivedListener((reponse) => {
      const donnees = reponse.notification.request.content.data as
        | { conversation_id?: string }
        | undefined;
      if (donnees?.conversation_id) {
        router.push(("/conversation/" + donnees.conversation_id) as Href);
      }
    });
    return () => ecoute.remove();
  }, [router]);

  useEffect(() => {
    if (!session) {
      setProfil(null);
      setProfilCharge(false);
      return;
    }
    charger();
  }, [session, chemin, charger]);

  if (chargementAuth || (session && !profilCharge)) {
    return (
      <View style={s.attente}>
        <ActivityIndicator size="large" color={Colors.prive.base} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Le lien de reinitialisation ouvre une session : on l'intercepte ici,
  // sinon l'etudiant atterrit sur son QG sans avoir change son mot de passe.
  if (modeRecuperation && chemin !== "/nouveau-mot-de-passe") {
    return <Redirect href={"/(app)/nouveau-mot-de-passe" as Href} />;
  }

  const surOnboarding = chemin === "/onboarding";
  const doitCompleter = !profil || !profil.estComplet;

  if (doitCompleter && !surOnboarding && !modeRecuperation) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.neutre.fond },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="nouveau-mot-de-passe" options={{ gestureEnabled: false }} />
      <Stack.Screen name="cours" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="devoirs" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="notes" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="budget" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="emploi-du-temps" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="membres" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="sujet/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="conversation/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="document/[nom]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="moderation" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

const s = StyleSheet.create({
  attente: {
    flex: 1,
    backgroundColor: Colors.neutre.fond,
    justifyContent: "center",
    alignItems: "center",
  },
});
