import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Ecran d'accueil provisoire de CampusLife.
 *
 * Il existe pour une seule raison : verifier que le projet tourne sur
 * le telephone avant d'ecrire quoi que ce soit de serieux. Il affiche
 * le programme de developpement, lot par lot. Chaque lot termine passe
 * en "fait" ici, puis cet ecran sera remplace par le vrai QG au lot 4.
 */

type Lot = {
  numero: string;
  titre: string;
  detail: string;
  zone: "prive" | "social" | "socle";
  fait: boolean;
};

const LOTS: Lot[] = [
  { numero: "0", titre: "Mise en place", detail: "Le projet tourne sur l'iPhone", zone: "socle", fait: false },
  { numero: "1", titre: "Compte et etablissement", detail: "Inscription par e-mail universitaire", zone: "socle", fait: false },
  { numero: "2", titre: "Etudes, saisie a la main", detail: "Cours, devoirs, notes", zone: "prive", fait: false },
  { numero: "3", titre: "Import de l'emploi du temps", detail: "Lien d'agenda ou fichier .ics", zone: "prive", fait: false },
  { numero: "4", titre: "Mon QG", detail: "Prochain cours, devoirs a rendre", zone: "socle", fait: false },
  { numero: "5", titre: "Communaute d'etablissement", detail: "Sujets, membres, moderation", zone: "social", fait: false },
  { numero: "6", titre: "Messages prives", detail: "Conversations 1 a 1", zone: "social", fait: false },
  { numero: "7", titre: "Avant de montrer a quelqu'un", detail: "Quota, CGU, build TestFlight", zone: "socle", fait: false },
];

const COULEUR_ZONE = {
  prive: Colors.prive.base,
  social: Colors.social.base,
  socle: Colors.neutre.discret,
} as const;

export default function Accueil() {
  const faits = LOTS.filter((l) => l.fait).length;

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.surtitre}>PROGRAMME DE DEV</Text>
        <Text style={styles.titre}>CampusLife</Text>
        <Text style={styles.sousTitre}>
          {faits} lot{faits > 1 ? "s" : ""} termine{faits > 1 ? "s" : ""} sur {LOTS.length}.
          L&apos;agenda d&apos;etudes, plus la communaute de mon ecole.
        </Text>

        <View style={styles.liste}>
          {LOTS.map((lot) => (
            <View key={lot.numero} style={styles.carte}>
              <View style={[styles.pastille, { backgroundColor: COULEUR_ZONE[lot.zone] }]}>
                <Text style={styles.pastilleTexte}>{lot.numero}</Text>
              </View>
              <View style={styles.carteTexte}>
                <Text style={styles.carteTitre}>{lot.titre}</Text>
                <Text style={styles.carteDetail}>{lot.detail}</Text>
              </View>
              <Text style={[styles.etat, lot.fait && styles.etatFait]}>
                {lot.fait ? "fait" : "a faire"}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.pied}>
          Ecran provisoire. Il saute au lot 4, quand le vrai QG le remplace.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl * 2 },
  surtitre: {
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.neutre.discret,
    fontWeight: "600",
  },
  titre: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.neutre.encre,
    marginTop: Espacements.xs,
    letterSpacing: -0.5,
  },
  sousTitre: {
    fontSize: 15,
    color: Colors.neutre.texte,
    marginTop: Espacements.sm,
    lineHeight: 22,
  },
  liste: { marginTop: Espacements.lg, gap: Espacements.sm },
  carte: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.md,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    padding: Espacements.md,
  },
  pastille: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  pastilleTexte: { color: Colors.neutre.blanc, fontWeight: "800", fontSize: 14 },
  carteTexte: { flex: 1 },
  carteTitre: { fontSize: 15, fontWeight: "700", color: Colors.neutre.encre },
  carteDetail: { fontSize: 13, color: Colors.neutre.texte, marginTop: 2 },
  etat: { fontSize: 11, color: Colors.neutre.discret, fontWeight: "600" },
  etatFait: { color: Colors.etat.succes },
  pied: {
    marginTop: Espacements.lg,
    fontSize: 12,
    color: Colors.neutre.discret,
    textAlign: "center",
  },
});
