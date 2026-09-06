import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Alerte from "@/components/Alerte";
import { DOCUMENTS, EDITEUR_INCOMPLET } from "@/constants/textes-legaux";
import { Espacements, Typo } from "@/constants/theme";

/** Affiche l'un des trois textes : conditions, confidentialité, règles. */
export default function DocumentLegalEcran() {
  const { nom } = useLocalSearchParams<{ nom: string }>();
  const doc = DOCUMENTS[nom ?? ""];

  if (!doc) {
    return (
      <Ecran entete={<Entete retour titre="Document introuvable" />}>
        <Alerte
          type="attention"
          texte="Ce document n'existe pas. Reviens en arrière et choisis-en un dans la liste."
        />
      </Ecran>
    );
  }

  return (
    <Ecran
      entete={
        <Entete
          retour
          surtitre={"Mise à jour du " + doc.miseAJour}
          titre={doc.titre}
          sousTitre={doc.sousTitre}
        />
      }
    >
      {EDITEUR_INCOMPLET && (
        <Alerte
          type="erreur"
          titre="Document incomplet"
          texte="L'identité de l'éditeur et l'adresse de contact ne sont pas renseignées. Elles doivent l'être avant toute diffusion en dehors du cercle de test."
        />
      )}

      <Carte>
        {doc.sections.map((section, i) => (
          <View key={section.titre} style={i > 0 ? s.section : undefined}>
            <Text style={[Typo.sousTitre, s.titre]}>{section.titre}</Text>
            {section.paragraphes.map((p, j) => (
              <Text key={j} style={[Typo.corps, s.paragraphe]}>
                {p}
              </Text>
            ))}
          </View>
        ))}
      </Carte>
    </Ecran>
  );
}

const s = StyleSheet.create({
  section: { marginTop: Espacements.lg },
  titre: { marginBottom: Espacements.sm },
  paragraphe: { marginBottom: Espacements.sm + 2 },
});
