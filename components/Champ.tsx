import { useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Colors, Espacements, Polices, Rayons, Typo } from "@/constants/theme";
import type { Ton } from "@/components/Bouton";

type Props = TextInputProps & {
  label?: string;
  aide?: string;
  erreur?: string | null;
  ton?: Ton;
  conteneur?: StyleProp<ViewStyle>;
};

/**
 * Un champ de saisie. La bordure change de couleur au focus : c'est le seul
 * retour visuel qui dit « c'est ici que tu écris » sur un petit écran.
 */
export default function Champ({ label, aide, erreur, ton = "prive", conteneur, style, ...reste }: Props) {
  const [focus, setFocus] = useState(false);
  const c = ton === "social" ? Colors.social : Colors.prive;

  const bordure = erreur ? Colors.etat.erreur : focus ? c.base : Colors.neutre.trait;

  return (
    <View style={conteneur}>
      {!!label && <Text style={[Typo.petitFort, s.label]}>{label}</Text>}
      <TextInput
        {...reste}
        onFocus={(e) => {
          setFocus(true);
          reste.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          reste.onBlur?.(e);
        }}
        placeholderTextColor={Colors.neutre.fantome}
        style={[
          s.champ,
          { borderColor: bordure, borderWidth: focus || !!erreur ? 1.5 : 1 },
          reste.multiline && s.multiligne,
          style,
        ]}
      />
      {!!erreur && <Text style={[Typo.petit, s.erreur]}>{erreur}</Text>}
      {!erreur && !!aide && <Text style={[Typo.petit, s.aide]}>{aide}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  label: { marginBottom: 7, color: Colors.neutre.encre },
  champ: {
    backgroundColor: Colors.neutre.surface,
    borderRadius: Rayons.md,
    paddingHorizontal: Espacements.md - 2,
    paddingVertical: 13,
    fontFamily: Polices.corps,
    fontSize: 16,
    color: Colors.neutre.encre,
  },
  multiligne: { minHeight: 96, textAlignVertical: "top", paddingTop: 13 },
  erreur: { marginTop: 6, color: Colors.etat.erreur },
  aide: { marginTop: 6 },
});
