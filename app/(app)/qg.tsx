import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { getMonProfil, type Profil } from "@/lib/api";
import {
  formaterDate,
  JOURS,
  listerCours,
  listerDevoirs,
  listerNotes,
  moyenne,
  type Cours,
  type Devoir,
} from "@/lib/etudes";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Mon QG.
 *
 * Version intermediaire : l'identite, les trois entrees du module Etudes avec
 * leurs chiffres reels, et l'avancement du programme. Au lot 4, il devient le
 * vrai tableau de bord du matin.
 */
export default function MonQG() {
  const { deconnexion } = useAuth();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [moyenneGenerale, setMoyenneGenerale] = useState<number | null>(null);
  const [chargement, setChargement] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let monte = true;
      (async () => {
        try {
          const [p, d, c, n] = await Promise.all([
            getMonProfil(),
            listerDevoirs(),
            listerCours(),
            listerNotes(),
          ]);
          if (!monte) return;
          setProfil(p);
          setDevoirs(d);
          setCours(c);
          setMoyenneGenerale(moyenne(n));
        } catch {
          if (monte) setProfil(null);
        } finally {
          if (monte) setChargement(false);
        }
      })();
      return () => {
        monte = false;
      };
    }, []),
  );

  const aFaire = devoirs.filter((d) => !d.fait);
  const prochain = aFaire.find((d) => d.echeance) ?? aFaire[0] ?? null;

  // JavaScript numerote les jours a partir de dimanche, la base a partir de lundi.
  const jourActuel = ((new Date().getDay() + 6) % 7) + 1;
  const coursDuJour = cours.filter((c) => c.jour === jourActuel);

  if (chargement) {
    return (
      <View style={s.attente}>
        <ActivityIndicator size="large" color={Colors.prive.base} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.contenu}>
        <View style={s.entete}>
          <View style={s.flex}>
            <Text style={s.salut}>Salut {profil?.prenom ?? ""}</Text>
            <Text style={s.ecole}>
              {profil?.ecole?.nom ?? "Ecole inconnue"}
              {profil?.anneeEtude ? " · " + profil.anneeEtude : ""}
              {profil?.filiere ? " · " + profil.filiere : ""}
            </Text>
          </View>
          <Pressable onPress={deconnexion} style={s.sortie}>
            <Text style={s.sortieTexte}>Quitter</Text>
          </Pressable>
        </View>

        <View style={s.aujourdhui}>
          <Text style={s.aujourdhuiLabel}>
            {JOURS[jourActuel - 1].toUpperCase()}
          </Text>
          {coursDuJour.length > 0 ? (
            coursDuJour.map((c) => (
              <View key={c.id} style={s.ligneCours}>
                <Text style={s.ligneHeure}>{c.debut}</Text>
                <Text style={s.ligneTitre}>{c.intitule}</Text>
                {!!c.salle && <Text style={s.ligneSalle}>{c.salle}</Text>}
              </View>
            ))
          ) : (
            <Text style={s.aujourdhuiVide}>Aucun cours aujourd&apos;hui.</Text>
          )}
          {prochain && (
            <Text style={s.prochain}>
              A rendre : {prochain.titre} · {formaterDate(prochain.echeance)}
            </Text>
          )}
        </View>

        <Text style={s.section}>Mes etudes</Text>
        <View style={s.grille}>
          <Link href="/devoirs" asChild>
            <Pressable style={s.tuile}>
              <Text style={s.tuileChiffre}>{aFaire.length}</Text>
              <Text style={s.tuileLabel}>
                devoir{aFaire.length > 1 ? "s" : ""} a rendre
              </Text>
            </Pressable>
          </Link>
          <Link href="/cours" asChild>
            <Pressable style={s.tuile}>
              <Text style={s.tuileChiffre}>{cours.length}</Text>
              <Text style={s.tuileLabel}>
                cours dans ma semaine
              </Text>
            </Pressable>
          </Link>
          <Link href="/notes" asChild>
            <Pressable style={[s.tuile, s.tuileLarge]}>
              <Text style={s.tuileChiffre}>
                {moyenneGenerale === null
                  ? "--"
                  : moyenneGenerale.toFixed(2).replace(".", ",")}
                <Text style={s.tuileSur}> / 20</Text>
              </Text>
              <Text style={s.tuileLabel}>ma moyenne generale</Text>
            </Pressable>
          </Link>
        </View>

        <Text style={s.section}>Construction</Text>
        <View style={s.avancement}>
          <Text style={s.avancementTitre}>2 lots termines sur 8</Text>
          <Text style={s.avancementTexte}>
            Le lot 3 branchera l&apos;import de ton emploi du temps, le lot 4
            transformera cet ecran en vrai tableau de bord.
          </Text>
          <View style={s.barre}>
            <View style={[s.barreRemplie, { width: "25%" }]} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  flex: { flex: 1 },
  attente: {
    flex: 1,
    backgroundColor: Colors.neutre.fond,
    justifyContent: "center",
    alignItems: "center",
  },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl * 2 },
  entete: { flexDirection: "row", alignItems: "flex-start", gap: Espacements.md },
  salut: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.neutre.encre,
  },
  ecole: { fontSize: 14, color: Colors.neutre.texte, marginTop: 4, lineHeight: 20 },
  sortie: {
    paddingHorizontal: Espacements.md,
    paddingVertical: 8,
    borderRadius: Rayons.sm,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
  },
  sortieTexte: { fontSize: 13, fontWeight: "600", color: Colors.neutre.texte },
  aujourdhui: {
    marginTop: Espacements.lg,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
  },
  aujourdhuiLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.prive.fonce,
  },
  aujourdhuiVide: {
    fontSize: 15,
    color: Colors.neutre.texte,
    marginTop: Espacements.sm,
  },
  ligneCours: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.sm,
    marginTop: Espacements.sm,
  },
  ligneHeure: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.prive.fonce,
    width: 46,
  },
  ligneTitre: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  ligneSalle: { fontSize: 12, color: Colors.neutre.discret },
  prochain: {
    marginTop: Espacements.md,
    paddingTop: Espacements.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.trait,
    fontSize: 13.5,
    color: Colors.neutre.texte,
  },
  section: {
    marginTop: Espacements.xl,
    marginBottom: Espacements.md,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
  },
  grille: { flexDirection: "row", flexWrap: "wrap", gap: Espacements.sm },
  tuile: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
  },
  tuileLarge: { flexBasis: "100%" },
  tuileChiffre: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.prive.fonce,
    letterSpacing: -0.8,
  },
  tuileSur: { fontSize: 15, fontWeight: "600", color: Colors.neutre.discret },
  tuileLabel: { fontSize: 13.5, color: Colors.neutre.texte, marginTop: 4 },
  avancement: {
    backgroundColor: Colors.prive.clair,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
  },
  avancementTitre: { fontSize: 15, fontWeight: "700", color: Colors.prive.fonce },
  avancementTexte: {
    fontSize: 13.5,
    color: Colors.neutre.texte,
    marginTop: 4,
    lineHeight: 20,
  },
  barre: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutre.blanc,
    marginTop: Espacements.md,
    overflow: "hidden",
  },
  barreRemplie: { height: "100%", backgroundColor: Colors.prive.base },
});
