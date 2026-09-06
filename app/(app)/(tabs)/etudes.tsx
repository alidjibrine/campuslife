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
import { Ionicons } from "@expo/vector-icons";
import { listerCours, listerDevoirs, listerNotes, moyenne } from "@/lib/etudes";
import { listerSources } from "@/lib/agenda";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/** Le sommaire de l'espace prive : quatre entrees, avec leurs chiffres. */
export default function Etudes() {
  const [devoirs, setDevoirs] = useState(0);
  const [cours, setCours] = useState(0);
  const [moyenneGenerale, setMoyenneGenerale] = useState<number | null>(null);
  const [seancesImportees, setSeancesImportees] = useState(0);
  const [chargement, setChargement] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let monte = true;
      (async () => {
        try {
          const [d, c, n, s2] = await Promise.all([
            listerDevoirs(),
            listerCours(),
            listerNotes(),
            listerSources(),
          ]);
          if (!monte) return;
          setDevoirs(d.filter((x) => !x.fait).length);
          setCours(c.length);
          setMoyenneGenerale(moyenne(n));
          setSeancesImportees(
            s2.reduce((total, source) => total + source.nombreSeances, 0),
          );
        } catch {
          /* les ecrans de detail afficheront l'erreur */
        } finally {
          if (monte) setChargement(false);
        }
      })();
      return () => {
        monte = false;
      };
    }, []),
  );

  const entrees = [
    {
      route: "/emploi-du-temps" as const,
      icone: "calendar-outline" as const,
      titre: "Mon emploi du temps",
      detail:
        seancesImportees > 0
          ? seancesImportees + " séances importées"
          : "Colle le lien de ton agenda universitaire",
    },
    {
      route: "/devoirs" as const,
      icone: "checkbox-outline" as const,
      titre: "Mes devoirs",
      detail:
        devoirs > 0
          ? devoirs + (devoirs > 1 ? " devoirs à rendre" : " devoir à rendre")
          : "Rien à rendre",
    },
    {
      route: "/cours" as const,
      icone: "school-outline" as const,
      titre: "Mes cours",
      detail: cours > 0 ? cours + " créneaux dans ma semaine" : "Aucun cours saisi",
    },
    {
      route: "/notes" as const,
      icone: "stats-chart-outline" as const,
      titre: "Mes notes",
      detail:
        moyenneGenerale === null
          ? "Aucune note"
          : "Moyenne de " + moyenneGenerale.toFixed(2).replace(".", ",") + " / 20",
    },
  ];

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.contenu}>
        <Text style={s.titre}>Études</Text>
        <Text style={s.accroche}>
          Ton espace privé. Personne d&apos;autre n&apos;y a accès, pas même les
          autres étudiants de ton école.
        </Text>

        {chargement && (
          <ActivityIndicator style={s.attente} color={Colors.prive.base} />
        )}

        <View style={s.liste}>
          {entrees.map((e) => (
            <Link key={e.route} href={e.route} asChild>
              <Pressable style={s.carte}>
                <View style={s.icone}>
                  <Ionicons name={e.icone} size={20} color={Colors.prive.fonce} />
                </View>
                <View style={s.flex}>
                  <Text style={s.carteTitre}>{e.titre}</Text>
                  <Text style={s.carteDetail}>{e.detail}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.neutre.discret}
                />
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={s.aVenir}>
          <Text style={s.aVenirTitre}>Plus tard</Text>
          <Text style={s.aVenirTexte}>
            Budget, Documents et Mémo font partie du projet mais attendent leur
            tour, après la mise en ligne. C&apos;est écrit dans le programme.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  flex: { flex: 1 },
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
  attente: { marginTop: Espacements.lg },
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
  icone: {
    width: 38,
    height: 38,
    borderRadius: Rayons.sm,
    backgroundColor: Colors.prive.clair,
    alignItems: "center",
    justifyContent: "center",
  },
  carteTitre: { fontSize: 15.5, fontWeight: "700", color: Colors.neutre.encre },
  carteDetail: { fontSize: 13, color: Colors.neutre.discret, marginTop: 2 },
  aVenir: {
    marginTop: Espacements.xl,
    padding: Espacements.lg,
    borderRadius: Rayons.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.neutre.trait,
  },
  aVenirTitre: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
  },
  aVenirTexte: {
    fontSize: 13.5,
    color: Colors.neutre.texte,
    marginTop: 6,
    lineHeight: 20,
  },
});
