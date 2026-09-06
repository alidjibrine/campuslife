import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Colors, Polices, Rayons } from "@/constants/theme";
import type { Ton } from "@/components/Bouton";

type Props = {
  nom?: string | null;
  url?: string | null;
  taille?: number;
  ton?: Ton;
};

/**
 * La photo de profil, ou les initiales dans un rond quand il n'y en a pas.
 *
 * La teinte des initiales dérive du nom, pour que deux personnes différentes
 * n'aient pas la même pastille dans une liste. Si l'image ne se charge pas,
 * on retombe sur les initiales plutôt que sur un carré vide.
 */
export default function Avatar({ nom, url, taille = 44, ton }: Props) {
  const [echec, setEchec] = useState(false);

  useEffect(() => {
    setEchec(false);
  }, [url]);

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

  const rond = { width: taille, height: taille, borderRadius: Rayons.rond };

  if (url && !echec) {
    return (
      <Image
        source={{ uri: url }}
        style={[rond, s.image]}
        resizeMode="cover"
        onError={() => setEchec(true)}
        accessibilityLabel={propre ? "Photo de " + propre : "Photo de profil"}
      />
    );
  }

  return (
    <View style={[s.base, rond, { backgroundColor: c.clair }]}>
      <Text style={[s.texte, { color: c.fonce, fontSize: taille * 0.36 }]}>{initiales}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  image: { backgroundColor: Colors.neutre.creux },
  texte: { fontFamily: Polices.corpsGras, letterSpacing: 0.2 },
});
