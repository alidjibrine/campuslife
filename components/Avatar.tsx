import { StyleSheet, Text, View } from "react-native";
import { Colors, Polices, Rayons } from "@/constants/theme";
import type { Ton } from "@/components/Bouton";

type Props = { nom?: string | null; taille?: number; ton?: Ton };

/**
 * Les initiales dans un rond. La teinte dérive du nom, pour que deux personnes
 * différentes n'aient pas la même pastille dans une liste.
 */
export default function Avatar({ nom, taille = 44, ton }: Props) {
  const propre = (nom ?? "").trim();
  const initiales =
    propre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot[0])
      .join("")
      .toUpperCase() || "?";

  const familles = [Colors.prive, Colors.social, Colors.accent];
  const somme = [...propre].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const c =
    ton === "prive"
      ? Colors.prive
      : ton === "social"
        ? Colors.social
        : familles[somme % familles.length];

  return (
    <View
      style={[
        s.base,
        { width: taille, height: taille, borderRadius: Rayons.rond, backgroundColor: c.clair },
      ]}
    >
      <Text style={[s.texte, { color: c.fonce, fontSize: taille * 0.36 }]}>{initiales}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  texte: { fontFamily: Polices.corpsGras, letterSpacing: 0.2 },
});
