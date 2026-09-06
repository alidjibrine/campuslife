import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Espacements, PRESSION, Rayons, Typo } from "@/constants/theme";
import type { Ton } from "@/components/Bouton";

type Props = {
  titre: string;
  surtitre?: string;
  sousTitre?: string;
  retour?: boolean;
  ton?: Ton;
  action?: ReactNode;
};

/**
 * L'en-tête d'écran. Toujours la même composition : un surtitre qui situe,
 * un grand titre, une ligne d'explication. Le retour est un bouton rond,
 * pas un lien texte : sur un téléphone, on vise avec le pouce.
 */
export default function Entete({
  titre,
  surtitre,
  sousTitre,
  retour,
  ton = "prive",
  action,
}: Props) {
  const router = useRouter();
  const c = ton === "social" ? Colors.social : Colors.prive;

  return (
    <View style={s.base}>
      {retour && (
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          style={({ pressed }) => [s.retour, pressed && { opacity: PRESSION }]}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.neutre.encre} />
        </Pressable>
      )}

      <View style={s.rangee}>
        <View style={s.flex}>
          {!!surtitre && (
            <Text style={[Typo.etiquette, { color: c.base }]}>{surtitre}</Text>
          )}
          <Text style={[Typo.grandTitre, !!surtitre && s.apresSurtitre]}>{titre}</Text>
          {!!sousTitre && <Text style={[Typo.corps, s.sousTitre]}>{sousTitre}</Text>}
        </View>
        {!!action && <View style={s.action}>{action}</View>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  base: { gap: Espacements.md },
  retour: {
    width: 38,
    height: 38,
    borderRadius: Rayons.rond,
    backgroundColor: Colors.neutre.surface,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  rangee: { flexDirection: "row", alignItems: "flex-end", gap: Espacements.md },
  flex: { flex: 1 },
  apresSurtitre: { marginTop: 5 },
  sousTitre: { marginTop: 5 },
  action: { paddingBottom: 3 },
});
