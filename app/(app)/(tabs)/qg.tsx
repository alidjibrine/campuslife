import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMonProfil, type Profil } from "@/lib/api";
import {
  formaterDate,
  joursRestants,
  listerCours,
  listerDevoirs,
  listerNotes,
  moyenne,
  type Devoir,
  type Note,
} from "@/lib/etudes";
import { formaterHeure, listerSeances } from "@/lib/agenda";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Mon QG : l'ecran du matin.
 *
 * Trois questions, dans l'ordre ou un etudiant se les pose en se levant :
 * qu'est-ce que j'ai aujourd'hui, qu'est-ce que je dois rendre bientot,
 * et ou j'en suis.
 */

type LigneProgramme = {
  cle: string;
  heure: string;
  intitule: string;
  salle: string | null;
};

export default function MonQG() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [programme, setProgramme] = useState<LigneProgramme[]>([]);
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chargement, setChargement] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let monte = true;
      (async () => {
        try {
          const debutJour = new Date();
          debutJour.setHours(0, 0, 0, 0);
          const finJour = new Date();
          finJour.setHours(23, 59, 59, 999);
          const jourActuel = ((debutJour.getDay() + 6) % 7) + 1;

          const [p, d, c, n, se] = await Promise.all([
            getMonProfil(),
            listerDevoirs(),
            listerCours(),
            listerNotes(),
            listerSeances(debutJour, finJour),
          ]);
          if (!monte) return;

          setProfil(p);
          setDevoirs(d.filter((x) => !x.fait));
          setNotes(n);
          setProgramme(
            [
              ...se.map((x) => ({
                cle: x.id,
                heure: formaterHeure(x.debut),
                intitule: x.intitule,
                salle: x.salle,
              })),
              ...c
                .filter((x) => x.jour === jourActuel)
                .map((x) => ({
                  cle: x.id,
                  heure: x.debut,
                  intitule: x.intitule,
                  salle: x.salle,
                })),
            ].sort((a, b) => a.heure.localeCompare(b.heure)),
          );
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

  if (chargement) {
    return (
      <View style={s.attente}>
        <ActivityIndicator size="large" color={Colors.prive.base} />
      </View>
    );
  }

  const maintenant = new Date();
  const heureActuelle =
    String(maintenant.getHours()).padStart(2, "0") +
    ":" +
    String(maintenant.getMinutes()).padStart(2, "0");
  const prochaine = programme.find((x) => x.heure >= heureActuelle) ?? null;
  const troisDevoirs = devoirs
    .slice()
    .sort((a, b) => {
      if (!a.echeance) return 1;
      if (!b.echeance) return -1;
      return a.echeance.localeCompare(b.echeance);
    })
    .slice(0, 3);
  const generale = moyenne(notes);
  const derniere = notes[0] ?? null;

  const salutation =
    maintenant.getHours() < 12
      ? "Bonjour"
      : maintenant.getHours() < 18
        ? "Bon après-midi"
        : "Bonsoir";

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.contenu}>
        <Text style={s.salut}>
          {salutation} {profil?.prenom ?? ""}
        </Text>
        <Text style={s.ecole}>
          {maintenant.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>

        <View style={s.bloc}>
          <Text style={s.blocTitre}>Aujourd&apos;hui</Text>
          {programme.length === 0 ? (
            <Text style={s.vide}>
              Rien au programme. Importe ton emploi du temps depuis
              l&apos;onglet Études, ou ajoute tes cours à la main.
            </Text>
          ) : (
            programme.map((x) => {
              const passe = x.heure < heureActuelle;
              const cestLaProchaine = prochaine?.cle === x.cle;
              return (
                <View
                  key={x.cle}
                  style={[s.ligne, cestLaProchaine && s.ligneProchaine]}
                >
                  <Text style={[s.heure, passe && s.passe]}>{x.heure}</Text>
                  <View style={s.flex}>
                    <Text style={[s.ligneTitre, passe && s.passe]}>
                      {x.intitule}
                    </Text>
                    {!!x.salle && <Text style={s.ligneSalle}>{x.salle}</Text>}
                  </View>
                  {cestLaProchaine && <Text style={s.marqueur}>à suivre</Text>}
                </View>
              );
            })
          )}
        </View>

        <View style={s.bloc}>
          <Text style={s.blocTitre}>À rendre</Text>
          {troisDevoirs.length === 0 ? (
            <Text style={s.vide}>Rien à rendre. Profites-en.</Text>
          ) : (
            troisDevoirs.map((d) => {
              const jours = joursRestants(d.echeance);
              const enRetard = jours !== null && jours < 0;
              const urgent = jours !== null && jours >= 0 && jours <= 2;
              return (
                <View key={d.id} style={s.ligne}>
                  <View style={s.flex}>
                    <Text style={s.ligneTitre}>{d.titre}</Text>
                    <Text style={s.ligneSalle}>
                      {d.matiere ? d.matiere + " · " : ""}
                      {formaterDate(d.echeance)}
                    </Text>
                  </View>
                  {jours !== null && (
                    <Text
                      style={[
                        s.badge,
                        urgent && s.badgeUrgent,
                        enRetard && s.badgeRetard,
                      ]}
                    >
                      {enRetard
                        ? "en retard"
                        : jours === 0
                          ? "aujourd'hui"
                          : "J-" + jours}
                    </Text>
                  )}
                </View>
              );
            })
          )}
          {devoirs.length > 3 && (
            <Text style={s.reste}>
              et {devoirs.length - 3} autre{devoirs.length - 3 > 1 ? "s" : ""}
            </Text>
          )}
        </View>

        <View style={s.blocMoyenne}>
          <View style={s.flex}>
            <Text style={s.moyenneLabel}>Ma moyenne</Text>
            <Text style={s.moyenneDetail}>
              {derniere
                ? "Dernière note : " +
                  derniere.intitule +
                  ", " +
                  String(derniere.valeur).replace(".", ",") +
                  " / " +
                  derniere.bareme
                : "Aucune note saisie"}
            </Text>
          </View>
          <Text style={s.moyenneValeur}>
            {generale === null ? "--" : generale.toFixed(2).replace(".", ",")}
          </Text>
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
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl },
  salut: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.neutre.encre,
  },
  ecole: {
    fontSize: 14,
    color: Colors.neutre.discret,
    marginTop: 4,
    textTransform: "capitalize",
  },
  bloc: {
    marginTop: Espacements.lg,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
  },
  blocTitre: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.prive.fonce,
    textTransform: "uppercase",
    marginBottom: Espacements.sm,
  },
  vide: { fontSize: 14.5, color: Colors.neutre.texte, lineHeight: 21 },
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.trait,
  },
  ligneProchaine: { backgroundColor: Colors.prive.clair, borderRadius: Rayons.sm },
  heure: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.prive.fonce,
    width: 48,
    paddingLeft: 4,
  },
  passe: { color: Colors.neutre.discret, fontWeight: "600" },
  ligneTitre: { fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  ligneSalle: { fontSize: 12.5, color: Colors.neutre.discret, marginTop: 2 },
  marqueur: {
    fontSize: 10.5,
    fontWeight: "800",
    color: Colors.prive.fonce,
    paddingRight: 6,
    textTransform: "uppercase",
  },
  badge: { fontSize: 11, fontWeight: "700", color: Colors.neutre.discret },
  badgeUrgent: { color: Colors.etat.alerte },
  badgeRetard: { color: Colors.etat.erreur },
  reste: {
    marginTop: Espacements.sm,
    fontSize: 12.5,
    color: Colors.neutre.discret,
  },
  blocMoyenne: {
    marginTop: Espacements.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.md,
    backgroundColor: Colors.prive.fonce,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
  },
  moyenneLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.prive.clair,
    textTransform: "uppercase",
  },
  moyenneDetail: { fontSize: 13.5, color: Colors.prive.clair, marginTop: 4 },
  moyenneValeur: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.neutre.blanc,
    letterSpacing: -1,
  },
});
