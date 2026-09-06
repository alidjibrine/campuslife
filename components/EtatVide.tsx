import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Espacements, Rayons, Typo } from "@/constants/theme";
import type { Icone, Ton } from "@/components/Bouton";

type Props = {
  icone: Icone;
  titre: string;
  texte: string;
  ton?: Ton;
  action?: ReactNode;
};

/**
 * L'écran vide. Il ne dit pas « aucune donnée », il dit ce qu'il manque et
 * ce qu'on peut faire. Un état vide sans porte de sortie est un cul-de-sac.
 */
export default function EtatVide({ icone, titre, texte, ton = "prive", action }: Props) {
  const c = ton === "social" ? Colors.social : Colors.prive;
  return (
    <View style={s.base}>
      <View style={[s.rond, { backgroundColor: c.clair }]}>
        <Ionicons name={icone} size={26} color={c.base} />
      </View>
      <Text style={[Typo.sousTitre, s.titre]}>{titre}</Text>
      <Text style={[Typo.corps, s.texte]}>{texte}</Text>
      {!!action && <View style={s.action}>{action}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    alignItems: "center",
    paddingVertical: Espacements.xl,
    paddingHorizontal: Espacements.md,
    backgroundColor: Colors.neutre.surface,
    borderRadius: Rayons.lg,
  },
  rond: {
    width: 58,
    height: 58,
    borderRadius: Rayons.rond,
    alignItems: "center",
    justifyContent: "center",
  },
  titre: { marginTop: Espacements.md, textAlign: "center" },
  texte: { marginTop: 6, textAlign: "center", maxWidth: 320 },
  action: { marginTop: Espacements.md },
});
