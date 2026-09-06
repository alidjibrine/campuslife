import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Espacements, Rayons, Typo } from "@/constants/theme";
import type { Icone } from "@/components/Bouton";

type Type = "erreur" | "attention" | "succes" | "info";

const STYLES: Record<Type, { fond: string; encre: string; icone: Icone }> = {
  erreur: { fond: Colors.etat.erreurClair, encre: Colors.etat.erreur, icone: "alert-circle" },
  attention: { fond: Colors.etat.alerteClair, encre: Colors.etat.alerte, icone: "warning" },
  succes: { fond: Colors.etat.succesClair, encre: Colors.etat.succes, icone: "checkmark-circle" },
  info: { fond: Colors.prive.clair, encre: Colors.prive.fonce, icone: "information-circle" },
};

/** Un message en ligne. Jamais une couleur d'espace, toujours une couleur d'état. */
export default function Alerte({
  type = "erreur",
  titre,
  texte,
}: {
  type?: Type;
  titre?: string;
  texte: string;
}) {
  const st = STYLES[type];
  return (
    <View style={[s.base, { backgroundColor: st.fond }]}>
      <Ionicons name={st.icone} size={18} color={st.encre} style={s.icone} />
      <View style={s.flex}>
        {!!titre && <Text style={[Typo.petitFort, { color: st.encre }]}>{titre}</Text>}
        <Text style={[Typo.petit, s.texte, !!titre && s.avecTitre]}>{texte}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    flexDirection: "row",
    gap: Espacements.sm + 2,
    padding: Espacements.md - 2,
    borderRadius: Rayons.md,
  },
  icone: { marginTop: 1 },
  flex: { flex: 1 },
  texte: { color: Colors.neutre.texte },
  avecTitre: { marginTop: 2 },
});
