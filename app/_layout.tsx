import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/AuthContext";

/**
 * Layout racine de CampusLife.
 *
 * Enveloppe toute l'app dans le AuthProvider et declare les deux groupes :
 *   (auth) : ecrans hors connexion
 *   (app)  : ecrans reserves aux connectes
 * L'aiguillage entre les deux se fait dans les layouts de chaque groupe.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
