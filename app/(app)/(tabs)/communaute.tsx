import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * La communaute, en attente du lot 5.
 *
 * L'ecran existe deja pour une raison : la base est prete, les regles d'acces
 * sont posees, et il vaut mieux annoncer ce qui arrive que laisser un onglet
 * qui ne repond pas.
 */
export default function Communaute() {
  const etapes = [
    "Le fil de ton ecole, avec les sujets publies par les autres etudiants",
    "Les reponses, en ordre chronologique",
    "L'annuaire des membres de ton etablissement",
    "Les messages prives, un a un",
    "Le bouton Signaler, sur chaque contenu",
  ];

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.contenu}>
        <Text style={s.titre}>Communaute</Text>
        <Text style={s.accroche}>
          L&apos;espace partage avec les etudiants de ton ecole, et uniquement
          de ton ecole.
        </Text>

        <View style={s.encart}>
          <Ionicons name="construct-outline" size={22} color={Colors.social.fonce} />
          <Text style={s.encartTitre}>En construction, lot 5</Text>
          <Text style={s.encartTexte}>
            La base est deja prete : publications, commentaires, abonnements et
            signalements existent, et sont deja filtres sur ton etablissement.
            Il ne manque que les ecrans.
          </Text>
        </View>

        <Text style={s.section}>Ce qui arrive</Text>
        <View style={s.liste}>
          {etapes.map((etape) => (
            <View key={etape} style={s.ligne}>
              <View style={s.puce} />
              <Text style={s.ligneTexte}>{etape}</Text>
            </View>
          ))}
        </View>

        <Text style={s.note}>
          Regle posee au cadrage : un etudiant ne voit que sa propre ecole. Deux
          comptes d&apos;etablissements differents sont invisibles l&apos;un pour
          l&apos;autre, et c&apos;est verifie cote base, pas seulement dans
          l&apos;affichage.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl },
  titre: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.neutre.encre,
  },
  accroche: {
    fontSize: 14.5,
    color: Colors.neutre.texte,
    marginTop: 6,
    lineHeight: 21,
  },
  encart: {
    marginTop: Espacements.lg,
    backgroundColor: Colors.social.clair,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
    gap: 6,
  },
  encartTitre: { fontSize: 16, fontWeight: "700", color: Colors.social.fonce },
  encartTexte: { fontSize: 14, color: Colors.neutre.texte, lineHeight: 21 },
  section: {
    marginTop: Espacements.xl,
    marginBottom: Espacements.sm,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
  },
  liste: { gap: Espacements.sm },
  ligne: { flexDirection: "row", alignItems: "flex-start", gap: Espacements.sm },
  puce: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.social.base,
    marginTop: 8,
  },
  ligneTexte: { flex: 1, fontSize: 14.5, color: Colors.neutre.texte, lineHeight: 21 },
  note: {
    marginTop: Espacements.xl,
    fontSize: 13,
    color: Colors.neutre.discret,
    lineHeight: 20,
  },
});
