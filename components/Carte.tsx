import { ReactNode } from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Colors, Espacements, Ombres, PRESSION, Rayons } from "@/constants/theme";

type Props = {
  children: ReactNode;
  variante?: "surface" | "creux" | "contour";
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  serree?: boolean;
};

/**
 * La carte. Une surface blanche posée sur le papier, avec une ombre douce.
 * Jamais un trait ET une ombre : la variante « contour » sert aux blocs
 * secondaires, qui ne doivent pas se détacher autant.
 */
export default function Carte({
  children,
  variante = "surface",
  onPress,
  onLongPress,
  style,
  serree,
}: Props) {
  const styles = [
    s.base,
    serree ? s.serree : s.aise,
    variante === "surface" && [s.surface, Ombres.douce],
    variante === "creux" && s.creux,
    variante === "contour" && s.contour,
    style,
  ];

  if (!onPress && !onLongPress) return <View style={styles}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [...styles, pressed && { opacity: PRESSION }]}
    >
      {children}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: { borderRadius: Rayons.lg, overflow: "hidden" },
  aise: { padding: Espacements.md },
  serree: { padding: Espacements.sm + 4 },
  surface: { backgroundColor: Colors.neutre.surface },
  creux: { backgroundColor: Colors.neutre.creux },
  contour: {
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
  },
});
