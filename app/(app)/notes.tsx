import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  creerNote,
  listerNotes,
  moyenne,
  moyenneParMatiere,
  supprimerNote,
  type Note,
} from "@/lib/etudes";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Mes notes.
 *
 * La moyenne est ponderee par les coefficients et ramenee sur 20, pour qu'une
 * note sur 40 ou sur 100 reste comparable aux autres.
 */
export default function EcranNotes() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [chargement, setChargement] = useState(true);
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

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={s.retour}>
            <Text style={s.retourTexte}>Retour</Text>
          </Pressable>

          <Text style={s.titre}>Mes notes</Text>

          <View style={s.moyenneBloc}>
            <Text style={s.moyenneLabel}>Moyenne générale</Text>
            <Text style={s.moyenneValeur}>
              {generale === null ? "--" : generale.toFixed(2).replace(".", ",")}
              <Text style={s.moyenneSur}> / 20</Text>
            </Text>
            <Text style={s.moyenneDetail}>
              {notes.length === 0
                ? "Aucune note saisie"
                : notes.length + (notes.length > 1 ? " notes, pondérées" : " note")}
            </Text>
          </View>

          {!formOuvert && (
            <Pressable style={s.ajout} onPress={() => setFormOuvert(true)}>
              <Text style={s.ajoutTexte}>Ajouter une note</Text>
            </Pressable>
          )}

          {formOuvert && (
            <View style={s.form}>
              <Text style={s.label}>Intitulé</Text>
              <TextInput
                style={s.champ}
                value={intitule}
                onChangeText={setIntitule}
                placeholder="Partiel, TD, oral..."
                placeholderTextColor={Colors.neutre.discret}
                editable={!enCours}
              />

              <Text style={[s.label, s.espace]}>Matière</Text>
              <TextInput
                style={s.champ}
                value={matiere}
                onChangeText={setMatiere}
                placeholder="Droit civil"
                placeholderTextColor={Colors.neutre.discret}
                editable={!enCours}
              />

              <View style={s.troisColonnes}>
                <View style={s.flex}>
                  <Text style={[s.label, s.espace]}>Note</Text>
                  <TextInput
                    style={s.champ}
                    value={valeur}
                    onChangeText={setValeur}
                    placeholder="15"
                    placeholderTextColor={Colors.neutre.discret}
                    keyboardType="decimal-pad"
                    editable={!enCours}
                  />
                </View>
                <View style={s.flex}>
                  <Text style={[s.label, s.espace]}>Sur</Text>
                  <TextInput
                    style={s.champ}
                    value={bareme}
                    onChangeText={setBareme}
                    keyboardType="decimal-pad"
                    editable={!enCours}
                  />
                </View>
                <View style={s.flex}>
                  <Text style={[s.label, s.espace]}>Coef.</Text>
                  <TextInput
                    style={s.champ}
                    value={coefficient}
                    onChangeText={setCoefficient}
                    keyboardType="decimal-pad"
                    editable={!enCours}
                  />
                </View>
              </View>
              <Text style={s.aide}>
                {saisieValide && baremeNum !== 20
                  ? "Soit " +
                    ((valeurNum / baremeNum) * 20).toFixed(2).replace(".", ",") +
                    " sur 20."
                  : "La note doit être comprise entre 0 et le barème."}
              </Text>

              <View style={s.actions}>
                <Pressable
                  style={s.annuler}
                  onPress={() => setFormOuvert(false)}
                  disabled={enCours}
                >
                  <Text style={s.annulerTexte}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[s.valider, !saisieValide && s.inactif]}
                  onPress={ajouter}
                  disabled={!saisieValide || enCours}
                >
                  {enCours ? (
                    <ActivityIndicator color={Colors.neutre.blanc} />
                  ) : (
                    <Text style={s.validerTexte}>Ajouter</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

          {chargement ? (
            <ActivityIndicator style={s.attente} size="large" color={Colors.prive.base} />
          ) : notes.length === 0 ? (
            <View style={s.vide}>
              <Text style={s.videTitre}>Aucune note</Text>
              <Text style={s.videTexte}>
                Saisis tes notes au fur et à mesure, la moyenne se calcule toute
                seule, coefficients compris.
              </Text>
            </View>
          ) : (
            <>
              {parMatiere.length > 1 && (
                <>
                  <Text style={s.section}>Par matière</Text>
                  <View style={s.liste}>
                    {parMatiere.map((m) => (
                      <View key={m.matiere} style={s.ligneMatiere}>
                        <Text style={s.matiereNom}>{m.matiere}</Text>
                        <Text style={s.matiereNombre}>
                          {m.nombre} note{m.nombre > 1 ? "s" : ""}
                        </Text>
                        <Text style={s.matiereMoyenne}>
                          {m.moyenne.toFixed(2).replace(".", ",")}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <Text style={s.section}>Toutes mes notes</Text>
              <View style={s.liste}>
                {notes.map((n) => (
                  <Pressable
                    key={n.id}
                    style={s.carte}
                    onLongPress={() => supprimer(n.id)}
                  >
                    <View style={s.flex}>
                      <Text style={s.carteTitre}>{n.intitule}</Text>
                      <Text style={s.carteDetail}>
                        {n.matiere ?? "sans matiere"}
                        {n.coefficient !== 1 ? " · coef. " + n.coefficient : ""}
                      </Text>
                    </View>
                    <Text style={s.noteValeur}>
                      {String(n.valeur).replace(".", ",")}
                      <Text style={s.noteBareme}> / {n.bareme}</Text>
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.astuce}>Appui long sur une note pour la supprimer.</Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  flex: { flex: 1 },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl * 2 },
  retour: { marginBottom: Espacements.md },
  retourTexte: { fontSize: 14, fontWeight: "600", color: Colors.prive.fonce },
  titre: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6, color: Colors.neutre.encre },
  moyenneBloc: {
    marginTop: Espacements.lg,
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
  moyenneValeur: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.neutre.blanc,
    marginTop: 6,
    letterSpacing: -1,
  },
  moyenneSur: { fontSize: 18, fontWeight: "600", color: Colors.prive.clair },
  moyenneDetail: { fontSize: 13, color: Colors.prive.clair, marginTop: 2 },
  ajout: {
    marginTop: Espacements.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.prive.base,
    borderRadius: Rayons.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  ajoutTexte: { fontSize: 15, fontWeight: "700", color: Colors.prive.fonce },
  form: {
    marginTop: Espacements.lg,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
  },
  label: { fontSize: 13, fontWeight: "700", color: Colors.neutre.encre, marginBottom: 6 },
  espace: { marginTop: Espacements.md },
  champ: {
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    paddingHorizontal: Espacements.md,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.neutre.encre,
    backgroundColor: Colors.neutre.fond,
  },
  aide: { fontSize: 12.5, color: Colors.neutre.discret, marginTop: 6 },
  troisColonnes: { flexDirection: "row", gap: Espacements.sm },
  actions: { flexDirection: "row", gap: Espacements.sm, marginTop: Espacements.lg },
  annuler: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Rayons.md,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    alignItems: "center",
  },
  annulerTexte: { fontSize: 15, fontWeight: "600", color: Colors.neutre.texte },
  valider: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Rayons.md,
    backgroundColor: Colors.prive.fonce,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  validerTexte: { fontSize: 15, fontWeight: "700", color: Colors.neutre.blanc },
  inactif: { opacity: 0.4 },
  erreur: { marginTop: Espacements.md, fontSize: 14, color: Colors.etat.erreur },
  attente: { marginTop: Espacements.xl },
  vide: {
    marginTop: Espacements.lg,
    padding: Espacements.lg,
    borderRadius: Rayons.lg,
    backgroundColor: Colors.prive.clair,
  },
  videTitre: { fontSize: 15, fontWeight: "700", color: Colors.prive.fonce },
  videTexte: { fontSize: 14, color: Colors.neutre.texte, marginTop: 4, lineHeight: 20 },
  section: {
    marginTop: Espacements.xl,
    marginBottom: Espacements.sm,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
  },
  liste: { gap: Espacements.sm },
  ligneMatiere: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.sm,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    paddingHorizontal: Espacements.md,
    paddingVertical: 12,
  },
  matiereNom: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  matiereNombre: { fontSize: 12, color: Colors.neutre.discret },
  matiereMoyenne: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.prive.fonce,
    minWidth: 52,
    textAlign: "right",
  },
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
  carteTitre: { fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  carteDetail: { fontSize: 13, color: Colors.neutre.discret, marginTop: 2 },
  noteValeur: { fontSize: 18, fontWeight: "800", color: Colors.neutre.encre },
  noteBareme: { fontSize: 13, fontWeight: "600", color: Colors.neutre.discret },
  astuce: {
    marginTop: Espacements.lg,
    fontSize: 12.5,
    color: Colors.neutre.discret,
    textAlign: "center",
  },
});
