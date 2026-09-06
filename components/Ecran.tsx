import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Alerte from "@/components/Alerte";
import Squelette from "@/components/Squelette";
import { Colors, Espacements } from "@/constants/theme";
import type { Ton } from "@/components/Bouton";

type Props = {
  children: ReactNode;
  entete?: ReactNode;
  ton?: Ton;
  chargement?: boolean;
  erreur?: string | null;
  rafraichit?: boolean;
  surRafraichir?: () => void;
  bas?: ReactNode;
  clavier?: boolean;
  espace?: number;
};

/**
 * Le cadre de tous les écrans.
 *
 * Il tient la gouttière, l'attente, l'erreur et le tirer-pour-rafraîchir au
 * même endroit, une bonne fois. Un écran n'a plus qu'à décrire son contenu :
 * c'est ce qui fait que vingt et un écrans se ressemblent sans qu'on ait eu
 * à y penser vingt et une fois.
 */
export default function Ecran({
  children,
  entete,
  ton = "prive",
  chargement,
  erreur,
  rafraichit,
  surRafraichir,
  bas,
  clavier,
  espace = Espacements.lg,
}: Props) {
  const c = ton === "social" ? Colors.social : Colors.prive;

  const corps = (
    <>
      <ScrollView
        contentContainerStyle={[s.contenu, { gap: espace }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          surRafraichir ? (
            <RefreshControl
              refreshing={!!rafraichit}
              onRefresh={surRafraichir}
              tintColor={c.base}
              colors={[c.base]}
            />
          ) : undefined
        }
      >
        {entete}
        {!!erreur && <Alerte type="erreur" texte={erreur} />}
        {chargement ? <Squelette /> : children}
      </ScrollView>
      {!!bas && <View style={s.bas}>{bas}</View>}
    </>
  );

  return (
    <SafeAreaView style={s.page} edges={["top", "left", "right"]}>
      {clavier ? (
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          {corps}
        </KeyboardAvoidingView>
      ) : (
        corps
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  flex: { flex: 1 },
  contenu: {
    paddingHorizontal: Espacements.gouttiere,
    paddingTop: Espacements.md,
    paddingBottom: Espacements.xxl,
  },
  bas: {
    paddingHorizontal: Espacements.gouttiere,
    paddingTop: Espacements.sm + 4,
    paddingBottom: Espacements.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.trait,
    backgroundColor: Colors.neutre.surface,
  },
});
