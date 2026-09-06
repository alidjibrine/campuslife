import { Pressable, StyleSheet, Text } from "react-native";
import { Colors, Espacements, PRESSION, Polices, Rayons } from "@/constants/theme";
import type { Ton } from "@/components/Bouton";

type Props = {
  libelle: string;
  actif?: boolean;
  onPress?: () => void;
  ton?: Ton;
  desactive?: boolean;
};

/** Un choix parmi plusieurs, sur une seule ligne. Filtres, catégories, années. */
export default function Puce({ libelle, actif, onPress, ton = "prive", desactive }: Props) {
  const c = ton === "social" ? Colors.social : Colors.prive;
  return (
    <Pressable
      onPress={onPress}
      disabled={desactive}
      accessibilityRole="button"
      accessibilityState={{ selected: !!actif }}
      style={({ pressed }) => [
        s.base,
        actif ? { backgroundColor: c.clair, borderColor: c.base } : s.repos,
        pressed && { opacity: PRESSION },
        desactive && s.inactif,
      ]}
    >
      <Text style={[s.texte, { color: actif ? c.fonce : Colors.neutre.texte }]}>{libelle}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    paddingHorizontal: Espacements.md - 2,
    paddingVertical: 9,
    borderRadius: Rayons.rond,
    borderWidth: 1.5,
  },
  repos: { backgroundColor: Colors.neutre.surface, borderColor: Colors.neutre.trait },
  inactif: { opacity: 0.4 },
  texte: { fontFamily: Polices.corpsFort, fontSize: 13.5, lineHeight: 18 },
});
