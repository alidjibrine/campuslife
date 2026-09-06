import { StyleSheet, Text, View } from "react-native";
import { Colors, Espacements, Polices, Rayons } from "@/constants/theme";
import type { Ton } from "@/components/Bouton";

type Props = {
  valeur: string | number;
  ton?: Ton | "accent" | "erreur";
  variante?: "plein" | "doux";
};

function palette(ton: Props["ton"]) {
  if (ton === "social") return { plein: Colors.social.base, doux: Colors.social.clair, encre: Colors.social.fonce };
  if (ton === "accent") return { plein: Colors.accent.base, doux: Colors.accent.clair, encre: Colors.accent.fonce };
  if (ton === "erreur") return { plein: Colors.etat.erreur, doux: Colors.etat.erreurClair, encre: Colors.etat.erreur };
  if (ton === "neutre") return { plein: Colors.neutre.encre, doux: Colors.neutre.creux, encre: Colors.neutre.texte };
  return { plein: Colors.prive.base, doux: Colors.prive.clair, encre: Colors.prive.fonce };
}

/** Une pastille de comptage ou d'état. Courte, toujours. */
export default function Badge({ valeur, ton = "prive", variante = "plein" }: Props) {
  const p = palette(ton);
  const plein = variante === "plein";
  return (
    <View style={[s.base, { backgroundColor: plein ? p.plein : p.doux }]}>
      <Text style={[s.texte, { color: plein ? Colors.neutre.blanc : p.encre }]}>{valeur}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  base: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: Espacements.sm - 1,
    borderRadius: Rayons.rond,
    alignItems: "center",
    justifyContent: "center",
  },
  texte: { fontFamily: Polices.corpsGras, fontSize: 11.5, lineHeight: 15 },
});
