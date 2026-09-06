import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DOCUMENTS, EDITEUR_INCOMPLET } from "@/constants/textes-legaux";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/** Affiche l'un des trois textes : conditions, confidentialite, regles. */
export default function DocumentLegalEcran() {
  const { nom } = useLocalSearchParams<{ nom: string }>();
  const router = useRouter();
  const doc = DOCUMENTS[nom ?? ""];

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.contenu}>
        <Pressable onPress={() => router.back()} style={s.retour} hitSlop={10}>
          <Text style={s.retourTexte}>Retour</Text>
        </Pressable>

        {!doc ? (
          <Text style={s.titre}>Document introuvable</Text>
        ) : (
          <>
            <Text style={s.titre}>{doc.titre}</Text>
            <Text style={s.sousTitre}>{doc.sousTitre}</Text>
            <Text style={s.maj}>Mise à jour du {doc.miseAJour}</Text>

            {EDITEUR_INCOMPLET && (
              <View style={s.alerte}>
                <Text style={s.alerteTitre}>Document incomplet</Text>
                <Text style={s.alerteTexte}>
                  L'identité de l'éditeur et l'adresse de contact ne sont pas
                  renseignées. Elles doivent l'être avant toute diffusion en
                  dehors du cercle de test.
                </Text>
              </View>
            )}

            {doc.sections.map((section) => (
              <View key={section.titre} style={s.section}>
                <Text style={s.sectionTitre}>{section.titre}</Text>
                {section.paragraphes.map((p, i) => (
                  <Text key={i} style={s.paragraphe}>
                    {p}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl },
  retour: { marginBottom: Espacements.md },
  retourTexte: { fontSize: 14, fontWeight: "600", color: Colors.prive.fonce },
  titre: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.neutre.encre,
  },
  sousTitre: {
    fontSize: 14.5,
    color: Colors.neutre.texte,
    marginTop: 6,
    lineHeight: 20,
  },
  maj: { fontSize: 12.5, color: Colors.neutre.discret, marginTop: 8 },
  alerte: {
    marginTop: Espacements.lg,
    padding: Espacements.md,
    borderRadius: Rayons.md,
    borderWidth: 1,
    borderColor: Colors.etat.erreur,
    backgroundColor: Colors.neutre.surface,
  },
  alerteTitre: { fontSize: 14, fontWeight: "800", color: Colors.etat.erreur },
  alerteTexte: {
    fontSize: 13.5,
    color: Colors.neutre.texte,
    marginTop: 4,
    lineHeight: 19,
  },
  section: { marginTop: Espacements.lg },
  sectionTitre: {
    fontSize: 15.5,
    fontWeight: "800",
    color: Colors.neutre.encre,
    marginBottom: 6,
  },
  paragraphe: {
    fontSize: 14.5,
    lineHeight: 22,
    color: Colors.neutre.texte,
    marginBottom: 8,
  },
});
