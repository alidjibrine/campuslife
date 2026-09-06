import { useCallback, useEffect, useState } from "react";
import { Redirect, Stack, usePathname } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { getMonProfil, type Profil } from "@/lib/api";
import { Colors } from "@/constants/theme";

/**
 * Ecrans reserves aux connectes.
 *
 * Deux gardes, dans cet ordre :
 *   1. pas de session, on renvoie vers la connexion
 *   2. profil incomplet, on renvoie vers l'onboarding
 *
 * Le profil est relu a chaque changement d'ecran : une fois l'onboarding
 * termine, la garde se leve toute seule sans avoir a recharger l'app.
 */
export default function AppLayout() {
  const { session, chargement: chargementAuth } = useAuth();
  const chemin = usePathname();
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

  const surOnboarding = chemin === "/onboarding";
  const doitCompleter = !profil || !profil.estComplet;

  if (doitCompleter && !surOnboarding) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.neutre.fond },
      }}
    >
      <Stack.Screen name="qg" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="cours" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="devoirs" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="notes" options={{ animation: "slide_from_right" }} />
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
