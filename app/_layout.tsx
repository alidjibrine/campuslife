import { useCallback, useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";
import { AuthProvider } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";

/**
 * Layout racine de CampusLife.
 *
 * Trois choses ici, et rien d'autre : les polices, le contexte
 * d'authentification, et les deux groupes d'écrans.
 *
 * Les polices sont chargées avant le premier rendu, sinon l'app s'affiche une
 * demi-seconde dans la police du système avant de sauter. Si le chargement
 * échoue, on affiche quand même : une police de secours vaut mieux qu'un
 * écran de démarrage qui ne part jamais.
 */

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [policesPretes, erreurPolices] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  const pret = policesPretes || !!erreurPolices;

  const masquerDemarrage = useCallback(async () => {
    if (pret) await SplashScreen.hideAsync().catch(() => {});
  }, [pret]);

  useEffect(() => {
    masquerDemarrage();
  }, [masquerDemarrage]);

  if (!pret) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Colors.neutre.fond }}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.neutre.fond },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
          <StatusBar style="dark" />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
