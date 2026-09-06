import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Section from "@/components/Section";
import Alerte from "@/components/Alerte";
import { listerCours, listerDevoirs, listerNotes, moyenne } from "@/lib/etudes";
import { listerSources } from "@/lib/agenda";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Polices, Rayons, Typo } from "@/constants/theme";
import type { Icone } from "@/components/Bouton";

/**
 * Le sommaire de l'espace privé.
 *
 * Quatre entrées, chacune avec son chiffre. Le chiffre est ce qui compte :
 * un sommaire qui ne dit que des titres oblige à ouvrir chaque écran pour
 * savoir s'il s'y passe quelque chose.
 */
export default function Etudes() {
  const router = useRouter();
  const [devoirs, setDevoirs] = useState(0);
  const [enRetard, setEnRetard] = useState(0);
  const [cours, setCours] = useState(0);
  const [moyenneGenerale, setMoyenneGenerale] = useState<number | null>(null);
  const [nombreNotes, setNombreNotes] = useState(0);
  const [seancesImportees, setSeancesImportees] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const [d, c, n, sources] = await Promise.all([
        listerDevoirs(),
        listerCours(),
        listerNotes(),
        listerSources(),
      ]);
      const aRendre = d.filter((x) => !x.fait);
      const aujourdhui = new Date().toISOString().slice(0, 10);
      setDevoirs(aRendre.length);
      setEnRetard(aRendre.filter((x) => x.echeance && x.echeance < aujourdhui).length);
      setCours(c.length);
      setMoyenneGenerale(moyenne(n));
      setNombreNotes(n.length);
      setSeancesImportees(sources.reduce((total, s2) => total + s2.nombreSeances, 0));
      setErreur(null);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
      setRafraichit(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const entrees: {
    route: string;
    icone: Icone;
    titre: string;
    detail: string;
    valeur: string;
    alerte?: boolean;
  }[] = [
    {
      route: "/emploi-du-temps",
      icone: "calendar",
      titre: "Mon emploi du temps",
      detail:
        seancesImportees > 0
          ? "séances importées"
          : "Colle le lien de ton agenda universitaire",
      valeur: seancesImportees > 0 ? String(seancesImportees) : "—",
    },
    {
      route: "/devoirs",
      icone: "checkbox",
      titre: "Mes devoirs",
      detail:
        enRetard > 0
          ? enRetard + (enRetard > 1 ? " en retard" : " en retard")
          : devoirs > 0
            ? devoirs > 1
              ? "devoirs à rendre"
              : "devoir à rendre"
            : "Rien à rendre",
      valeur: devoirs > 0 ? String(devoirs) : "—",
      alerte: enRetard > 0,
    },
    {
      route: "/cours",
      icone: "school",
      titre: "Mes cours",
      detail: cours > 0 ? "créneaux dans ma semaine" : "Aucun cours saisi",
      valeur: cours > 0 ? String(cours) : "—",
    },
    {
      route: "/notes",
      icone: "stats-chart",
      titre: "Mes notes",
      detail:
        moyenneGenerale === null
          ? "Aucune note"
          : "de moyenne · " + nombreNotes + (nombreNotes > 1 ? " notes" : " note"),
      valeur:
        moyenneGenerale === null
          ? "—"
          : moyenneGenerale.toFixed(2).replace(".", ","),
    },
  ];

  return (
    <Ecran
      chargement={chargement}
      erreur={erreur}
      rafraichit={rafraichit}
      surRafraichir={() => {
        setRafraichit(true);
        charger();
      }}
      entete={
        <Entete
          surtitre="Espace privé"
          titre="Études"
          sousTitre="Personne d'autre n'y a accès, pas même les autres étudiants de ton école."
        />
      }
    >
      <Section espace={Espacements.sm + 4}>
        {entrees.map((e) => (
          <Carte key={e.route} onPress={() => router.push(e.route as Href)}>
            <View style={s.ligne}>
              <View style={[s.icone, e.alerte && s.iconeAlerte]}>
                <Ionicons
                  name={e.icone}
                  size={19}
                  color={e.alerte ? Colors.etat.alerte : Colors.prive.base}
                />
              </View>
              <View style={s.flex}>
                <Text style={Typo.corpsFort}>{e.titre}</Text>
                <Text style={[Typo.petit, s.detail, e.alerte && s.detailAlerte]}>
                  {e.detail}
                </Text>
              </View>
              <Text style={[s.valeur, e.alerte && s.valeurAlerte]}>{e.valeur}</Text>
              <Ionicons name="chevron-forward" size={17} color={Colors.neutre.fantome} />
            </View>
          </Carte>
        ))}
      </Section>

      <Alerte
        type="info"
        titre="Budget, Documents et Mémo"
        texte="Ils font partie du projet mais attendent leur tour, après la mise en ligne. C'est écrit dans le programme, pour ne pas y revenir chaque semaine."
      />
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  ligne: { flexDirection: "row", alignItems: "center", gap: Espacements.md - 2 },
  icone: {
    width: 42,
    height: 42,
    borderRadius: Rayons.md,
    backgroundColor: Colors.prive.clair,
    alignItems: "center",
    justifyContent: "center",
  },
  iconeAlerte: { backgroundColor: Colors.accent.clair },
  detail: { marginTop: 2 },
  detailAlerte: { color: Colors.etat.alerte },
  valeur: {
    fontFamily: Polices.titre,
    fontSize: 22,
    letterSpacing: -0.6,
    color: Colors.neutre.encre,
  },
  valeurAlerte: { color: Colors.etat.alerte },
});
