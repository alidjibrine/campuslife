import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors, Espacements, PRESSION, Typo } from "@/constants/theme";

type Props = {
  titre?: string;
  lien?: { libelle: string; onPress: () => void };
  children: ReactNode;
  espace?: number;
};

/** Un titre de rubrique et son contenu. Le seul endroit où l'on écrit en capitales. */
export default function Section({ titre, lien, children, espace = Espacements.sm + 4 }: Props) {
  return (
    <View style={s.base}>
      {(!!titre || !!lien) && (
        <View style={s.entete}>
          {!!titre && <Text style={Typo.etiquette}>{titre}</Text>}
          {!!lien && (
            <Pressable
              onPress={lien.onPress}
              style={({ pressed }) => pressed && { opacity: PRESSION }}
            >
              <Text style={[Typo.petitFort, s.lien]}>{lien.libelle}</Text>
            </Pressable>
          )}
        </View>
      )}
      <View style={{ gap: espace }}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  base: { gap: Espacements.sm + 2 },
  entete: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lien: { color: Colors.prive.fonce },
});
