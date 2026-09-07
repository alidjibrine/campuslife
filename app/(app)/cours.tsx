import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Puce from "@/components/Puce";
import Bouton from "@/components/Bouton";
import Section from "@/components/Section";
import EtatVide from "@/components/EtatVide";
import {
  creerCours,
  JOURS,
  listerCours,
  modifierCours,
  supprimerCours,
  type Cours,
} from "@/lib/etudes";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, PRESSION, Polices, Typo } from "@/constants/theme";

/**
 * Mes cours, semaine type.
 *
 * Saisie manuelle. L'import d'un emploi du temps remplit l'écran voisin tout
 * seul à partir d'un lien d'agenda : cet écran-ci reste pour les créneaux qui
 * n'y figurent pas.
 */
export default function EcranCours() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [formOuvert, setFormOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [intitule, setIntitule] = useState("");
  const [jour, setJour] = useState(1);
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [salle, setSalle] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setCours(await listerCours());
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

  const heureValide = (h: string) => /^\d{1,2}[:h]\d{2}$/.test(h.trim());
  const normaliser = (h: string) => {
    const m = h.trim().match(/^(\d{1,2})[:h](\d{2})$/);
    if (!m) return h.trim();
    return String(m[1]).padStart(2, "0") + ":" + m[2];
  };

  const peutValider =
    intitule.trim().length > 1 && heureValide(debut) && heureValide(fin) && !enCours;

  function fermerForm() {
    setFormOuvert(false);
    setEnEdition(null);
    setIntitule("");
    setDebut("");
    setFin("");
    setSalle("");
    setJour(1);
  }

  /** Ouvre le meme formulaire, prerempli. Un ecran de plus n'apporterait rien. */
  function ouvrirModification(c: Cours) {
    setEnEdition(c.id);
    setIntitule(c.intitule);
    setJour(c.jour);
    setDebut(c.debut);
    setFin(c.fin);
    setSalle(c.salle ?? "");
    setFormOuvert(true);
  }

  async function enregistrer() {
    if (!peutValider) return;
    setEnCours(true);
    try {
      const champs = {
        intitule,
        jour,
        debut: normaliser(debut),
        fin: normaliser(fin),
        salle: salle || null,
      };
      if (enEdition) {
        await modifierCours(enEdition, champs);
      } else {
        await creerCours(champs);
      }
      fermerForm();
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  function menu(c: Cours) {
    Alert.alert(c.intitule, undefined, [
      { text: "Modifier", onPress: () => ouvrirModification(c) },
      { text: "Supprimer", style: "destructive", onPress: () => supprimer(c.id) },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  async function supprimer(id: string) {
    setCours((liste) => liste.filter((c) => c.id !== id));
    try {
      await supprimerCours(id);
    } catch (e) {
      setErreur(messageErreur(e));
      await charger();
    }
  }

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
          surtitre="Semaine type"
          titre="Mes cours"
          sousTitre={
            cours.length > 0
              ? cours.length + (cours.length > 1 ? " créneaux" : " créneau")
              : undefined
          }
          action={
            !formOuvert ? (
              <Bouton
                titre="Ajouter"
                taille="sm"
                icone="add"
                onPress={() => {
                  setEnEdition(null);
                  setFormOuvert(true);
                }}
              />
            ) : undefined
          }
        />
      }
    >
      {formOuvert && (
        <Carte style={s.form}>
          <Champ
            label="Intitulé"
            value={intitule}
            onChangeText={setIntitule}
            placeholder="Droit civil"
            editable={!enCours}
          />

          <View style={s.espace}>
            <Text style={[Typo.petitFort, s.label]}>Jour</Text>
            <View style={s.puces}>
              {JOURS.map((j, i) => (
                <Puce
                  key={j}
                  libelle={j.slice(0, 3)}
                  actif={jour === i + 1}
                  onPress={() => setJour(i + 1)}
                  desactive={enCours}
                />
              ))}
            </View>
          </View>

          <View style={[s.espace, s.rangee]}>
            <Champ
              conteneur={s.flex}
              label="Début"
              value={debut}
              onChangeText={setDebut}
              placeholder="08:00"
              keyboardType="numbers-and-punctuation"
              editable={!enCours}
            />
            <Champ
              conteneur={s.flex}
              label="Fin"
              value={fin}
              onChangeText={setFin}
              placeholder="10:00"
              keyboardType="numbers-and-punctuation"
              editable={!enCours}
            />
          </View>

          <Champ
            conteneur={s.espace}
            label="Salle"
            value={salle}
            onChangeText={setSalle}
            placeholder="Amphi 3"
            editable={!enCours}
            aide="Facultatif."
          />

          <View style={s.actions}>
            <Bouton
              titre="Annuler"
              variante="discret"
              taille="sm"
              onPress={fermerForm}
              desactive={enCours}
            />
            <Bouton
              titre={enEdition ? "Enregistrer" : "Ajouter"}
              taille="sm"
              onPress={enregistrer}
              enCours={enCours}
              desactive={!peutValider}
            />
          </View>
        </Carte>
      )}

      {cours.length === 0 && !formOuvert ? (
        <EtatVide
          icone="school-outline"
          titre="Aucun cours pour l'instant"
          texte="Ajoute tes matières et leurs créneaux. Ou colle le lien de ton agenda universitaire, et tout se remplit d'un coup."
          action={
            <Bouton
              titre="Ajouter un cours"
              icone="add"
              onPress={() => {
                setEnEdition(null);
                setFormOuvert(true);
              }}
            />
          }
        />
      ) : (
        JOURS.map((nomJour, i) => {
          const duJour = cours.filter((c) => c.jour === i + 1);
          if (duJour.length === 0) return null;
          return (
            <Section key={nomJour} titre={nomJour}>
              <Carte>
                {duJour.map((c, j) => (
                  <Pressable
                    key={c.id}
                    onPress={() => ouvrirModification(c)}
                    onLongPress={() => menu(c)}
                    style={({ pressed }) => [
                      s.creneau,
                      j < duJour.length - 1 && s.trait,
                      pressed && { opacity: PRESSION },
                    ]}
                  >
                    <View style={s.heures}>
                      <Text style={s.heure}>{c.debut}</Text>
                      <Text style={s.heureFin}>{c.fin}</Text>
                    </View>
                    <View style={s.barre} />
                    <View style={s.flex}>
                      <Text style={Typo.corpsFort} numberOfLines={2}>
                        {c.intitule}
                      </Text>
                      {!!c.salle && <Text style={Typo.petit}>{c.salle}</Text>}
                    </View>
                    <Bouton
                      titre=""
                      libelleAccessible={"Options de " + c.intitule}
                      variante="discret"
                      taille="sm"
                      icone="ellipsis-horizontal"
                      onPress={() => menu(c)}
                    />
                  </Pressable>
                ))}
              </Carte>
            </Section>
          );
        })
      )}
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  form: { padding: Espacements.lg },
  espace: { marginTop: Espacements.md },
  label: { marginBottom: 9, color: Colors.neutre.encre },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Espacements.sm },
  rangee: { flexDirection: "row", gap: Espacements.sm + 4 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Espacements.sm,
    marginTop: Espacements.lg,
  },
  creneau: {
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
});
