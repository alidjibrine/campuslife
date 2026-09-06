import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { getMonProfil, type Profil as TypeProfil } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/** Mon profil : qui je suis, mon ecole, et la sortie. */
export default function Profil() {
  const { deconnexion } = useAuth();
  const router = useRouter();
  const [profil, setProfil] = useState<TypeProfil | null>(null);
  const [chargement, setChargement] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let monte = true;
      getMonProfil()
        .then((p) => monte && setProfil(p))
        .catch(() => monte && setProfil(null))
        .finally(() => monte && setChargement(false));
      return () => {
        monte = false;
      };
    }, []),
  );

  function confirmerDeconnexion() {
    Alert.alert("Se deconnecter", "Tu devras retaper ton mot de passe.", [
      { text: "Annuler", style: "cancel" },
      { text: "Se deconnecter", style: "destructive", onPress: deconnexion },
    ]);
  }

  if (chargement) {
    return (
      <View style={s.attente}>
        <ActivityIndicator size="large" color={Colors.prive.base} />
      </View>
    );
  }

  const initiales = ((profil?.prenom?.[0] ?? "") + (profil?.nom?.[0] ?? ""))
    .toUpperCase()
    .trim();

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.contenu}>
        <View style={s.entete}>
          <View style={s.pastille}>
            <Text style={s.initiales}>{initiales || "?"}</Text>
          </View>
          <View style={s.flex}>
            <Text style={s.nom}>
              {profil?.prenom ?? ""} {profil?.nom ?? ""}
            </Text>
            <Text style={s.email}>{profil?.email ?? ""}</Text>
          </View>
        </View>

        <View style={s.bloc}>
          <View style={s.champ}>
            <Text style={s.champLabel}>Etablissement</Text>
            <Text style={s.champValeur}>
              {profil?.ecole?.nom ?? "Non rattache"}
            </Text>
          </View>
          <View style={s.champ}>
            <Text style={s.champLabel}>Annee</Text>
            <Text style={s.champValeur}>{profil?.anneeEtude ?? "Non renseignee"}</Text>
          </View>
          <View style={[s.champ, s.dernier]}>
            <Text style={s.champLabel}>Filiere</Text>
            <Text style={s.champValeur}>{profil?.filiere ?? "Non renseignee"}</Text>
          </View>
        </View>

        <Pressable
          style={s.action}
          onPress={() => router.push("/(app)/onboarding")}
        >
          <Text style={s.actionTexte}>Modifier mes informations</Text>
        </Pressable>

        <Pressable style={[s.action, s.sortie]} onPress={confirmerDeconnexion}>
          <Text style={[s.actionTexte, s.sortieTexte]}>Me deconnecter</Text>
        </Pressable>

        <Text style={s.version}>CampusLife, version de developpement</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  flex: { flex: 1 },
  attente: {
    flex: 1,
    backgroundColor: Colors.neutre.fond,
    justifyContent: "center",
    alignItems: "center",
  },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl },
  entete: { flexDirection: "row", alignItems: "center", gap: Espacements.md },
  pastille: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.prive.fonce,
    alignItems: "center",
    justifyContent: "center",
  },
  initiales: { fontSize: 20, fontWeight: "800", color: Colors.neutre.blanc },
  nom: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: Colors.neutre.encre,
  },
  email: { fontSize: 13.5, color: Colors.neutre.discret, marginTop: 2 },
  bloc: {
    marginTop: Espacements.lg,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.lg,
    paddingHorizontal: Espacements.lg,
  },
  champ: {
    paddingVertical: Espacements.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutre.trait,
  },
  dernier: { borderBottomWidth: 0 },
  champLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
  },
  champValeur: { fontSize: 15.5, color: Colors.neutre.encre, marginTop: 4 },
  action: {
    marginTop: Espacements.md,
    paddingVertical: 14,
    borderRadius: Rayons.md,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    backgroundColor: Colors.neutre.surface,
    alignItems: "center",
  },
  actionTexte: { fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  sortie: { borderColor: Colors.etat.erreur },
  sortieTexte: { color: Colors.etat.erreur },
  version: {
    marginTop: Espacements.xl,
    fontSize: 12,
    color: Colors.neutre.discret,
    textAlign: "center",
  },
});
