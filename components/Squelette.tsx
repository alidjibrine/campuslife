import { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/** Un bloc gris qui respire, le temps que les données arrivent. */
export function Bloc({
  hauteur = 14,
  largeur = "100%",
  style,
}: {
  hauteur?: number;
  largeur?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
}) {
  const pulsation = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsation, {
          toValue: 1,
          duration: 780,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulsation, {
          toValue: 0.45,
          duration: 780,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [pulsation]);

  return (
    <Animated.View
      style={[
        { height: hauteur, width: largeur, opacity: pulsation },
        s.bloc,
        style,
      ]}
    />
  );
}

/** L'attente par défaut d'un écran : trois cartes fantômes plutôt qu'un rond qui tourne. */
export default function Squelette({ cartes = 3 }: { cartes?: number }) {
  return (
    <View style={s.liste}>
      {Array.from({ length: cartes }).map((_, i) => (
        <View key={i} style={s.carte}>
          <Bloc hauteur={13} largeur="42%" />
          <Bloc hauteur={17} largeur="82%" style={s.espace} />
          <Bloc hauteur={13} largeur="60%" style={s.espacePetit} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bloc: { backgroundColor: Colors.neutre.trait, borderRadius: Rayons.sm },
  liste: { gap: Espacements.sm + 4 },
  carte: {
    backgroundColor: Colors.neutre.surface,
    borderRadius: Rayons.lg,
    padding: Espacements.md,
  },
  espace: { marginTop: 12 },
  espacePetit: { marginTop: 8 },
});
