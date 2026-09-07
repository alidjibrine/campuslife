import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Bouton from "@/components/Bouton";
import Section from "@/components/Section";
import Alerte from "@/components/Alerte";
import EtatVide from "@/components/EtatVide";
import {
  ajouterSourceLien,
  debutDeSemaine,
  formaterHeure,
  formaterJourLong,
  listerSeances,
  listerSources,
  supprimerSource,
  synchroniser,
  type Seance,
  type SourceAgenda,
} from "@/lib/agenda";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, PRESSION, Polices, Rayons, Typo } from "@/constants/theme";

/**
 * Import de l'emploi du temps.
 *
 * L'étudiant colle le lien d'agenda fourni par son université, ADE ou Celcat,
 * et sa semaine se remplit. Aucune école n'a besoin de donner son accord :
 * ces liens sont déjà publiés pour être synchronisés dans un agenda.
 */
export default function EmploiDuTemps() {
  const [sources, setSources] = useState<SourceAgenda[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [decalageSemaine, setDecalageSemaine] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [formOuvert, setFormOuvert] = useState(false);
  const [lien, setLien] = useState("");
  const [libelle, setLibelle] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const lundi = debutDeSemaine(new Date());
  lundi.setDate(lundi.getDate() + decalageSemaine * 7);
  const dimanche = new Date(lundi);
  dimanche.setDate(dimanche.getDate() + 6);
  dimanche.setHours(23, 59, 59, 999);

  const charger = useCallback(async () => {
    try {
      const [s2, e] = await Promise.all([listerSources(), listerSeances(lundi, dimanche)]);
      setSources(s2);
      setSeances(e);
      setErreur(null);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
      setRafraichit(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decalageSemaine]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  async function ajouter() {
    if (lien.trim().length < 8 || enCours) return;
    setEnCours(true);
    setErreur(null);
    setInfo(null);
    let creee: string | null = null;
    try {
      const source = await ajouterSourceLien(lien, libelle);
      creee = source.id;
      const nombre = await synchroniser(source);
      setInfo(nombre + " séances importées.");
      setLien("");
      setLibelle("");
      setFormOuvert(false);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
      // La source vient d'être créée et sa première synchronisation a échoué :
      // on la retire, sinon elle reste dans la liste avec zéro séance et un
      // lien dont on sait déjà qu'il ne fonctionne pas.
      if (creee) {
        try {
          await supprimerSource(creee);
        } catch {
          // Tant pis, l'étudiant pourra la supprimer à la main.
        }
      }
      await charger();
    } finally {
      setEnCours(false);
    }
  }

  async function mettreAJour(source: SourceAgenda) {
    setEnCours(true);
    setErreur(null);
    setInfo(null);
    try {
      const nombre = await synchroniser(source);
      setInfo(nombre + " séances à jour.");
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  function confirmerRetrait(source: SourceAgenda) {
    Alert.alert(
      "Retirer cet agenda",
      "Les séances importées depuis ce lien disparaissent de ta semaine.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            setEnCours(true);
            try {
              await supprimerSource(source.id);
              await charger();
            } catch (e) {
              setErreur(messageErreur(e));
            } finally {
              setEnCours(false);
            }
          },
        },
      ],
    );
  }

  // Regroupement des séances par jour de la semaine affichée.
  const parJour: { jour: Date; seances: Seance[] }[] = [];
  for (let i = 0; i < 7; i += 1) {
    const jour = new Date(lundi);
    jour.setDate(jour.getDate() + i);
    const duJour = seances.filter(
      (x) =>
        x.debut.getFullYear() === jour.getFullYear() &&
        x.debut.getMonth() === jour.getMonth() &&
        x.debut.getDate() === jour.getDate(),
    );
    if (duJour.length > 0) parJour.push({ jour, seances: duJour });
  }

  const aujourdhui = new Date();
  const libelleSemaine =
    decalageSemaine === 0
      ? "Cette semaine"
      : lundi.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) +
        " au " +
        dimanche.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <Ecran
      clavier
      chargement={chargement}
      erreur={erreur}
      rafraichit={rafraichit}
      surRafraichir={() => {
        setRafraichit(true);
        charger();
      }}
      entete={
        <Entete
          retour
          surtitre="Espace privé"
          titre="Mon emploi du temps"
          sousTitre={
            sources.length === 0
              ? "Colle le lien de ton agenda universitaire, ta semaine se remplit toute seule."
              : undefined
          }
        />
      }
    >
      {!!info && <Alerte type="succes" texte={info} />}

      {/* Navigation de semaine. Toujours visible : sans elle, on croit que
          l'app ne connaît que la semaine en cours. */}
      <View style={s.navigation}>
        <Pressable
          onPress={() => setDecalageSemaine((d) => d - 1)}
          hitSlop={8}
          accessibilityLabel="Semaine précédente"
          style={({ pressed }) => [s.fleche, pressed && { opacity: PRESSION }]}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.neutre.encre} />
        </Pressable>
        <Pressable
          onPress={() => setDecalageSemaine(0)}
          style={({ pressed }) => [s.semaine, pressed && { opacity: PRESSION }]}
        >
          <Text style={Typo.corpsFort}>{libelleSemaine}</Text>
        </Pressable>
        <Pressable
          onPress={() => setDecalageSemaine((d) => d + 1)}
          hitSlop={8}
          accessibilityLabel="Semaine suivante"
          style={({ pressed }) => [s.fleche, pressed && { opacity: PRESSION }]}
        >
          <Ionicons name="chevron-forward" size={18} color={Colors.neutre.encre} />
        </Pressable>
      </View>

      {parJour.length === 0 ? (
        <EtatVide
          icone="calendar-outline"
          titre="Aucune séance cette semaine"
          texte={
            sources.length === 0
              ? "Ton université publie déjà ton emploi du temps sous forme de lien à synchroniser, depuis ADE ou Celcat. Cherche « exporter mon agenda » sur ton espace numérique, copie le lien qui se termine par .ics, et colle-le ici."
              : "Soit l'agenda n'a rien pour cette semaine, soit elle est vraiment vide. Les vacances existent."
          }
          action={
            sources.length === 0 && !formOuvert ? (
              <Bouton
                titre="Ajouter mon agenda"
                icone="link-outline"
                onPress={() => setFormOuvert(true)}
              />
            ) : undefined
          }
        />
      ) : (
        parJour.map(({ jour, seances: duJour }) => {
          const cestAujourdhui =
            jour.getFullYear() === aujourdhui.getFullYear() &&
            jour.getMonth() === aujourdhui.getMonth() &&
            jour.getDate() === aujourdhui.getDate();
          return (
            <Section
              key={jour.toISOString()}
              titre={formaterJourLong(jour) + (cestAujourdhui ? " · aujourd'hui" : "")}
            >
              <Carte>
                {duJour.map((x, i) => (
                  <View key={x.id} style={[s.seance, i < duJour.length - 1 && s.trait]}>
                    <View style={s.heures}>
                      <Text style={s.heure}>{formaterHeure(x.debut)}</Text>
                      <Text style={s.heureFin}>{formaterHeure(x.fin)}</Text>
                    </View>
                    <View
                      style={[
                        s.barre,
                        cestAujourdhui && { backgroundColor: Colors.accent.base },
                      ]}
                    />
                    <View style={s.flex}>
                      <Text style={Typo.corpsFort} numberOfLines={2}>
                        {x.intitule}
                      </Text>
                      {!!x.salle && <Text style={Typo.petit}>{x.salle}</Text>}
                    </View>
                  </View>
                ))}
              </Carte>
            </Section>
          );
        })
      )}

      <Section
        titre="Mes agendas"
        lien={
          !formOuvert
            ? { libelle: sources.length ? "Ajouter" : "Ajouter un agenda", onPress: () => setFormOuvert(true) }
            : undefined
        }
      >
        {formOuvert && (
          <Carte style={s.form}>
            <Champ
              label="Lien de l'agenda"
              value={lien}
              onChangeText={setLien}
              placeholder="https://ade.unistra.fr/...ical"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!enCours}
              aide="Les liens en webcal:// fonctionnent aussi, ils sont convertis."
            />
            <Champ
              conteneur={s.espace}
              label="Nom"
              value={libelle}
              onChangeText={setLibelle}
              placeholder="Mon emploi du temps"
              editable={!enCours}
              aide="Facultatif."
            />
            <View style={s.actions}>
              <Bouton
                titre="Annuler"
                variante="discret"
                taille="sm"
                onPress={() => setFormOuvert(false)}
                desactive={enCours}
              />
              <Bouton
                titre="Importer"
                taille="sm"
                icone="download-outline"
                onPress={ajouter}
                enCours={enCours}
                desactive={lien.trim().length < 8}
              />
            </View>
          </Carte>
        )}

        {sources.length > 0 && (
          <Carte>
            {sources.map((source, i) => (
              <View key={source.id} style={[s.source, i < sources.length - 1 && s.trait]}>
                <View style={s.flex}>
                  <Text style={Typo.corpsFort} numberOfLines={1}>
                    {source.libelle}
                  </Text>
                  <Text style={Typo.petit}>
                    {source.nombreSeances + (source.nombreSeances > 1 ? " séances" : " séance")}
                    {source.derniereSynchro
                      ? " · maj " +
                        new Date(source.derniereSynchro).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })
                      : " · jamais synchronisé"}
                  </Text>
                </View>
                <Bouton
                  titre="Mettre à jour"
                  variante="contour"
                  taille="sm"
                  onPress={() => mettreAJour(source)}
                  desactive={enCours}
                />
                <Pressable
                  onPress={() => confirmerRetrait(source)}
                  hitSlop={10}
                  accessibilityLabel="Retirer cet agenda"
                  style={({ pressed }) => pressed && { opacity: PRESSION }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.neutre.fantome} />
                </Pressable>
              </View>
            ))}
          </Carte>
        )}
      </Section>
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.sm,
    backgroundColor: Colors.neutre.surface,
    borderRadius: Rayons.md,
    padding: 6,
  },
  fleche: {
    width: 36,
    height: 36,
    borderRadius: Rayons.sm,
    backgroundColor: Colors.neutre.creux,
    alignItems: "center",
    justifyContent: "center",
  },
  semaine: { flex: 1, alignItems: "center" },
  seance: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.sm + 4,
    paddingVertical: Espacements.sm + 4,
  },
  trait: { borderBottomWidth: 1, borderBottomColor: Colors.neutre.traitDoux },
  heures: { width: 46 },
  heure: {
    fontFamily: Polices.corpsGras,
    fontSize: 14,
    color: Colors.neutre.encre,
    letterSpacing: 0.2,
  },
  heureFin: { fontFamily: Polices.corps, fontSize: 12.5, color: Colors.neutre.discret },
  barre: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: Colors.prive.surligne,
  },
  form: { padding: Espacements.lg },
  espace: { marginTop: Espacements.md },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Espacements.sm,
    marginTop: Espacements.lg,
  },
  source: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.sm + 4,
    paddingVertical: Espacements.sm + 4,
  },
});
