import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Bouton from "@/components/Bouton";
import Section from "@/components/Section";
import EtatVide from "@/components/EtatVide";
import {
  creerNote,
  listerNotes,
  moyenne,
  moyenneParMatiere,
  supprimerNote,
  type Note,
} from "@/lib/etudes";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, PRESSION, Polices, Rayons, Typo } from "@/constants/theme";

/**
 * Mes notes.
 *
 * La moyenne est pondérée par les coefficients et ramenée sur 20, pour qu'une
 * note sur 40 ou sur 100 reste comparable aux autres.
 */
export default function EcranNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [formOuvert, setFormOuvert] = useState(false);
  const [intitule, setIntitule] = useState("");
  const [matiere, setMatiere] = useState("");
  const [valeur, setValeur] = useState("");
  const [bareme, setBareme] = useState("20");
  const [coefficient, setCoefficient] = useState("1");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setNotes(await listerNotes());
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

  const nombre = (t: string) => Number(t.replace(",", "."));
  const valeurNum = nombre(valeur);
  const baremeNum = nombre(bareme);
  const coefNum = nombre(coefficient);
  const saisieValide =
    intitule.trim().length > 1 &&
    Number.isFinite(valeurNum) &&
    valeurNum >= 0 &&
    Number.isFinite(baremeNum) &&
    baremeNum > 0 &&
    valeurNum <= baremeNum &&
    Number.isFinite(coefNum) &&
    coefNum > 0;

  const noteHorsBareme =
    valeur.trim().length > 0 &&
    Number.isFinite(valeurNum) &&
    Number.isFinite(baremeNum) &&
    baremeNum > 0 &&
    valeurNum > baremeNum;

  async function ajouter() {
    if (!saisieValide || enCours) return;
    setEnCours(true);
    try {
      await creerNote({
        intitule,
        matiere: matiere || null,
        valeur: valeurNum,
        bareme: baremeNum,
        coefficient: coefNum,
      });
      setIntitule("");
      setValeur("");
      setBareme("20");
      setCoefficient("1");
      setFormOuvert(false);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer(id: string) {
    setNotes((liste) => liste.filter((n) => n.id !== id));
    try {
      await supprimerNote(id);
    } catch (e) {
      setErreur(messageErreur(e));
      await charger();
    }
  }

  const generale = moyenne(notes);
  const parMatiere = moyenneParMatiere(notes);
  const fr = (n: number) => n.toFixed(2).replace(".", ",");

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
          titre="Mes notes"
          action={
            !formOuvert ? (
              <Bouton
                titre="Ajouter"
                taille="sm"
                icone="add"
                onPress={() => setFormOuvert(true)}
              />
            ) : undefined
          }
        />
      }
    >
      <Carte style={s.moyenneCarte}>
        <Text style={[Typo.etiquette, s.moyenneLabel]}>Moyenne générale</Text>
        <View style={s.moyenneLigne}>
          <Text style={s.moyenneChiffre}>{generale === null ? "—" : fr(generale)}</Text>
          <Text style={s.moyenneBareme}>/ 20</Text>
        </View>
        <Text style={[Typo.petit, s.moyenneDetail]}>
          {notes.length === 0
            ? "Aucune note saisie"
            : notes.length +
              (notes.length > 1 ? " notes, pondérées" : " note") +
              " par leurs coefficients"}
        </Text>
      </Carte>

      {formOuvert && (
        <Carte style={s.form}>
          <Champ
            label="Intitulé"
            value={intitule}
            onChangeText={setIntitule}
            placeholder="Partiel, TD, oral..."
            editable={!enCours}
          />
          <Champ
            conteneur={s.espace}
            label="Matière"
            value={matiere}
            onChangeText={setMatiere}
            placeholder="Droit civil"
            editable={!enCours}
            aide="Facultatif."
          />
          <View style={[s.espace, s.rangee]}>
            <Champ
              conteneur={s.flex}
              label="Note"
              value={valeur}
              onChangeText={setValeur}
              placeholder="14"
              keyboardType="decimal-pad"
              editable={!enCours}
            />
            <Champ
              conteneur={s.flex}
              label="Sur"
              value={bareme}
              onChangeText={setBareme}
              placeholder="20"
              keyboardType="decimal-pad"
              editable={!enCours}
            />
            <Champ
              conteneur={s.flex}
              label="Coef."
              value={coefficient}
              onChangeText={setCoefficient}
              placeholder="1"
              keyboardType="decimal-pad"
              editable={!enCours}
            />
          </View>
          {noteHorsBareme && (
            <Text style={[Typo.petit, s.erreurSaisie]}>
              La note doit être comprise entre 0 et le barème.
            </Text>
          )}
          <View style={s.actions}>
            <Bouton
              titre="Annuler"
              variante="discret"
              taille="sm"
              onPress={() => setFormOuvert(false)}
              desactive={enCours}
            />
            <Bouton
              titre="Ajouter"
              taille="sm"
              onPress={ajouter}
              enCours={enCours}
              desactive={!saisieValide}
            />
          </View>
        </Carte>
      )}

      {notes.length === 0 && !formOuvert ? (
        <EtatVide
          icone="stats-chart-outline"
          titre="Aucune note"
          texte="Saisis tes notes au fur et à mesure, la moyenne se calcule toute seule, coefficients compris."
          action={<Bouton titre="Ajouter une note" icone="add" onPress={() => setFormOuvert(true)} />}
        />
      ) : (
        <>
          {parMatiere.length > 1 && (
            <Section titre="Par matière">
              <Carte>
                {parMatiere.map((m, i) => (
                  <View
                    key={m.matiere}
                    style={[s.ligne, i < parMatiere.length - 1 && s.trait]}
                  >
                    <View style={s.flex}>
                      <Text style={Typo.corpsFort} numberOfLines={1}>
                        {m.matiere}
                      </Text>
                      <Text style={Typo.petit}>
                        {m.nombre + (m.nombre > 1 ? " notes" : " note")}
                      </Text>
                    </View>
                    <Text style={s.valeurMatiere}>{fr(m.moyenne)}</Text>
                  </View>
                ))}
              </Carte>
            </Section>
          )}

          <Section titre="Toutes mes notes">
            <Carte>
              {notes.map((n, i) => (
                <Pressable
                  key={n.id}
                  onLongPress={() => supprimer(n.id)}
                  style={({ pressed }) => [
                    s.ligne,
                    i < notes.length - 1 && s.trait,
                    pressed && { opacity: PRESSION },
                  ]}
                >
                  <View style={s.flex}>
                    <Text style={Typo.corpsFort} numberOfLines={1}>
                      {n.intitule}
                    </Text>
                    <Text style={Typo.petit}>
                      {[n.matiere, n.coefficient !== 1 ? "coef. " + n.coefficient : null]
                        .filter(Boolean)
                        .join(" · ") || "Sans matière"}
                    </Text>
                  </View>
                  <View style={s.valeurBloc}>
                    <Text style={s.valeur}>
                      {String(n.valeur).replace(".", ",")}
                      <Text style={s.surBareme}>/{n.bareme}</Text>
                    </Text>
                    {n.bareme !== 20 && (
                      <Text style={s.ramene}>soit {fr((n.valeur / n.bareme) * 20)}/20</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </Carte>
          </Section>

          <Text style={[Typo.petit, s.astuce]}>Appui long sur une note pour la supprimer.</Text>
        </>
      )}
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  moyenneCarte: { backgroundColor: Colors.prive.fonce, padding: Espacements.lg },
  moyenneLabel: { color: Colors.prive.surligne },
  moyenneLigne: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 },
  moyenneChiffre: {
    fontFamily: Polices.titre,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.6,
    color: Colors.neutre.blanc,
  },
  moyenneBareme: {
    fontFamily: Polices.corpsFort,
    fontSize: 17,
    color: Colors.prive.surligne,
  },
  moyenneDetail: { color: Colors.prive.surligne, marginTop: 2 },
  form: { padding: Espacements.lg },
  espace: { marginTop: Espacements.md },
  rangee: { flexDirection: "row", gap: Espacements.sm + 2 },
  erreurSaisie: { marginTop: Espacements.sm, color: Colors.etat.erreur },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Espacements.sm,
    marginTop: Espacements.lg,
  },
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.md,
    paddingVertical: Espacements.sm + 4,
  },
  trait: { borderBottomWidth: 1, borderBottomColor: Colors.neutre.traitDoux },
  valeurMatiere: {
    fontFamily: Polices.titre,
    fontSize: 19,
    letterSpacing: -0.5,
    color: Colors.prive.fonce,
  },
  valeurBloc: { alignItems: "flex-end" },
  valeur: {
    fontFamily: Polices.titre,
    fontSize: 19,
    letterSpacing: -0.5,
    color: Colors.neutre.encre,
  },
  surBareme: { fontFamily: Polices.corps, fontSize: 13, color: Colors.neutre.discret },
  ramene: { fontFamily: Polices.corps, fontSize: 11.5, color: Colors.neutre.fantome },
  astuce: { textAlign: "center" },
});
