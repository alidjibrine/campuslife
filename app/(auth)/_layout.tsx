import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";

/** Ecrans hors connexion. Un etudiant deja connecte n'a rien a y faire. */
export default function AuthLayout() {
  const { session, chargement } = useAuth();

  if (chargement) {
    return (
      <View style={s.attente}>
        <ActivityIndicator size="large" color={Colors.prive.base} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/qg" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.neutre.fond },
      }}
    />
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
