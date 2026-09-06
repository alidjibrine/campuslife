import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Espacements, PRESSION, Typo } from "@/constants/theme";

type Props = {
  titre: string;
  detail?: string | null;
  gauche?: ReactNode;
  droite?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  attenue?: boolean;
  dernier?: boolean;
};

/**
 * Une ligne de liste. Les lignes d'un même bloc partagent leur trait de
 * séparation, sauf la dernière : c'est ce qui fait qu'un bloc se lit comme
 * un objet et non comme une pile.
 */
export default function Ligne({
  titre,
  detail,
  gauche,
  droite,
  chevron,
  onPress,
  onLongPress,
  attenue,
  dernier,
}: Props) {
  const contenu = (
    <>
      {!!gauche && <View>{gauche}</View>}
      <View style={s.flex}>
        <Text style={[Typo.corpsFort, attenue && s.attenue]} numberOfLines={2}>
          {titre}
        </Text>
        {!!detail && (
          <Text style={[Typo.petit, s.detail]} numberOfLines={2}>
            {detail}
          </Text>
        )}
      </View>
      {!!droite && <View>{droite}</View>}
      {chevron && (
        <Ionicons name="chevron-forward" size={17} color={Colors.neutre.fantome} />
      )}
    </>
  );

  const styles = [s.base, !dernier && s.trait];

  if (!onPress && !onLongPress) return <View style={styles}>{contenu}</View>;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [...styles, pressed && { opacity: PRESSION }]}
    >
      {contenu}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.md - 2,
    paddingVertical: Espacements.md - 2,
  },
  trait: { borderBottomWidth: 1, borderBottomColor: Colors.neutre.traitDoux },
  flex: { flex: 1 },
  detail: { marginTop: 2 },
  attenue: { color: Colors.neutre.fantome, textDecorationLine: "line-through" },
});
