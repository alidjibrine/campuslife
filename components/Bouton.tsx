import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Espacements, PRESSION, Rayons, Typo } from "@/constants/theme";

export type Ton = "prive" | "social" | "neutre";
export type Icone = keyof typeof Ionicons.glyphMap;

type Props = {
  titre: string;
  onPress?: () => void;
  variante?: "plein" | "contour" | "discret" | "danger";
  ton?: Ton;
  taille?: "md" | "sm";
  icone?: Icone;
  pleineLargeur?: boolean;
  enCours?: boolean;
  desactive?: boolean;
  /** Obligatoire quand le bouton n'a qu'une icone : sans lui, il est muet
   *  pour un lecteur d'ecran. */
  libelleAccessible?: string;
};

function couleur(ton: Ton) {
  if (ton === "social") return Colors.social;
  if (ton === "neutre") {
    return { base: Colors.neutre.encre, fonce: Colors.neutre.encre, clair: Colors.neutre.creux };
  }
  return Colors.prive;
}

/**
 * Le bouton. Quatre variantes, jamais plus d'un « plein » par écran :
 * c'est lui qui dit quelle est l'action principale, et deux actions
 * principales sur un écran, c'est aucune.
 */
export default function Bouton({
  titre,
  onPress,
  variante = "plein",
  ton = "prive",
  taille = "md",
  icone,
  pleineLargeur,
  enCours,
  desactive,
  libelleAccessible,
}: Props) {
  const c = couleur(ton);
  const inactif = desactive || enCours;

  const fond =
    variante === "plein"
      ? c.base
      : variante === "danger"
        ? Colors.etat.erreur
        : variante === "contour"
          ? "transparent"
          : Colors.neutre.creux;

  const bordure =
    variante === "contour" ? c.base : variante === "discret" ? "transparent" : "transparent";

  const encre =
    variante === "plein" || variante === "danger"
      ? Colors.neutre.blanc
      : variante === "contour"
        ? c.fonce
        : Colors.neutre.encre;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactif}
      accessibilityRole="button"
      accessibilityLabel={libelleAccessible ?? titre}
      accessibilityState={{ disabled: !!inactif, busy: !!enCours }}
      style={({ pressed }) => [
        s.base,
        taille === "sm" ? s.sm : s.md,
        !titre && (taille === "sm" ? s.rondSm : s.rondMd),
        { backgroundColor: fond, borderColor: bordure },
        variante === "contour" && s.contour,
        pleineLargeur && s.large,
        pressed && { opacity: PRESSION },
        inactif && s.inactif,
      ]}
    >
      {enCours ? (
        <ActivityIndicator size="small" color={encre} />
      ) : (
        <View style={s.contenu}>
          {!!icone && (
            <Ionicons name={icone} size={taille === "sm" ? 15 : 17} color={encre} />
          )}
          {!!titre && (
            <Text style={[Typo.bouton, { color: encre }, taille === "sm" && s.texteSm]}>
              {titre}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: Rayons.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    alignSelf: "flex-start",
  },
  md: { paddingHorizontal: Espacements.lg, minHeight: 50 },
  sm: { paddingHorizontal: Espacements.md, minHeight: 38, borderRadius: Rayons.sm },
  contour: { borderWidth: 1.5 },
  rondSm: { paddingHorizontal: 0, width: 38 },
  rondMd: { paddingHorizontal: 0, width: 50 },
  large: { alignSelf: "stretch" },
  inactif: { opacity: 0.38 },
  contenu: { flexDirection: "row", alignItems: "center", gap: Espacements.sm },
  texteSm: { fontSize: 14 },
});
