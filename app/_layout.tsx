import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Layout racine de CampusLife.
 *
 * Volontairement nu pour l'instant. Le AuthProvider et les deux groupes
 * (auth) et (app) arrivent au lot 1.
 *
 * Le SafeAreaProvider est indispensable des maintenant : sans lui, les
 * ecrans qui utilisent SafeAreaView plantent au demarrage.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
