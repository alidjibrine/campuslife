import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Espacements, Rayons, Typo } from "@/constants/theme";

/**
 * Point d'entrée de CampusLife.
 *
 * Le temps de savoir s'il y a une session, on montre la marque plutôt qu'un
 * rond qui tourne sur fond vide : c'est la toute première image de l'app.
 */
export default function Entree() {
  const { session, chargement } = useAuth();

  if (chargement) {
    return (
      <View style={s.attente}>
        <View style={s.traits}>
          <View style={[s.trait, { backgroundColor: Colors.prive.base }]} />
          <View style={[s.trait, { backgroundColor: Colors.social.base }]} />
        </View>
        <Text style={s.marque}>CampusLife</Text>
        <ActivityIndicator
          style={s.rond}
          size="small"
          color={Colors.neutre.fantome}
        />
      </View>
    );
  }

  return session ? <Redirect href="/qg" /> : <Redirect href="/(auth)/login" />;
}

const s = StyleSheet.create({
  attente: {
    flex: 1,
    backgroundColor: Colors.neutre.fond,
    justifyContent: "center",
    alignItems: "center",
  },
  traits: { flexDirection: "row", gap: 6, marginBottom: Espacements.md },
  trait: { width: 26, height: 6, borderRadius: Rayons.rond },
  marque: {
    fontFamily: Typo.grandTitre.fontFamily,
    fontSize: 30,
    letterSpacing: -0.9,
    color: Colors.neutre.encre,
  },
  rond: { marginTop: Espacements.lg },
});
