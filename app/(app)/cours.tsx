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
  creerCours,
  JOURS,
  listerCours,
  supprimerCours,
  type Cours,
} from "@/lib/etudes";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Mes cours, semaine type.
 *
 * Saisie manuelle pour l'instant. Au lot 3, l'import d'un emploi du temps
 * remplira cet ecran tout seul a partir d'un lien d'agenda.
 */
export default function EcranCours() {
  const router = useRouter();
  const [cours, setCours] = useState<Cours[]>([]);
  const [chargement, setChargement] = useState(true);
  const [formOuvert, setFormOuvert] = useState(false);
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
    intitule.trim().length > 1 &&
    heureValide(debut) &&
    heureValide(fin) &&
    !enCours;

  async function ajouter() {
    if (!peutValider) return;
    setEnCours(true);
    try {
      await creerCours({
        intitule,
        jour,
        debut: normaliser(debut),
        fin: normaliser(fin),
        salle: salle || null,
      });
      setIntitule("");
      setDebut("");
      setFin("");
      setSalle("");
      setFormOuvert(false);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
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
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={s.retour}>
            <Text style={s.retourTexte}>Retour</Text>
          </Pressable>

          <Text style={s.titre}>Mes cours</Text>
          <Text style={s.accroche}>Ta semaine type, matiere par matiere.</Text>

          {!formOuvert && (
            <Pressable style={s.ajout} onPress={() => setFormOuvert(true)}>
              <Text style={s.ajoutTexte}>Ajouter un cours</Text>
            </Pressable>
          )}

          {formOuvert && (
            <View style={s.form}>
              <Text style={s.label}>Matiere</Text>
              <TextInput
                style={s.champ}
                value={intitule}
                onChangeText={setIntitule}
                placeholder="Droit civil"
                placeholderTextColor={Colors.neutre.discret}
                editable={!enCours}
              />

              <Text style={[s.label, s.espace]}>Jour</Text>
              <View style={s.puces}>
                {JOURS.map((nom, i) => {
                  const valeur = i + 1;
                  const actif = jour === valeur;
                  return (
                    <Pressable
                      key={nom}
                      onPress={() => setJour(valeur)}
                      disabled={enCours}
                      style={[s.puce, actif && s.puceActive]}
                    >
                      <Text style={[s.puceTexte, actif && s.puceTexteActif]}>
                        {nom.slice(0, 3)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={s.deuxColonnes}>
                <View style={s.flex}>
                  <Text style={[s.label, s.espace]}>Debut</Text>
                  <TextInput
                    style={s.champ}
                    value={debut}
                    onChangeText={setDebut}
                    placeholder="08:00"
                    placeholderTextColor={Colors.neutre.discret}
                    keyboardType="numbers-and-punctuation"
                    editable={!enCours}
                  />
                </View>
                <View style={s.flex}>
                  <Text style={[s.label, s.espace]}>Fin</Text>
                  <TextInput
                    style={s.champ}
                    value={fin}
                    onChangeText={setFin}
                    placeholder="10:00"
                    placeholderTextColor={Colors.neutre.discret}
                    keyboardType="numbers-and-punctuation"
                    editable={!enCours}
                  />
                </View>
              </View>

              <Text style={[s.label, s.espace]}>Salle</Text>
              <TextInput
                style={s.champ}
                value={salle}
                onChangeText={setSalle}
                placeholder="C2025"
                placeholderTextColor={Colors.neutre.discret}
                editable={!enCours}
              />
              <Text style={s.aide}>Facultatif.</Text>

              <View style={s.actions}>
                <Pressable
                  style={s.annuler}
                  onPress={() => setFormOuvert(false)}
                  disabled={enCours}
                >
                  <Text style={s.annulerTexte}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[s.valider, !peutValider && s.inactif]}
                  onPress={ajouter}
                  disabled={!peutValider}
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

          {erreur && <Text style={s.erreur}>{erreur}</Text>}

          {chargement ? (
            <ActivityIndicator style={s.attente} size="large" color={Colors.prive.base} />
          ) : cours.length === 0 ? (
            <View style={s.vide}>
              <Text style={s.videTitre}>Aucun cours pour l&apos;instant</Text>
              <Text style={s.videTexte}>
                Ajoute tes matieres et leurs creneaux. Au lot 3, un simple lien
                d&apos;emploi du temps remplira tout ca d&apos;un coup.
              </Text>
            </View>
          ) : (
            JOURS.map((nom, i) => {
              const duJour = cours.filter((c) => c.jour === i + 1);
              if (duJour.length === 0) return null;
              return (
                <View key={nom} style={s.groupe}>
                  <Text style={s.section}>{nom}</Text>
                  <View style={s.liste}>
                    {duJour.map((c) => (
                      <Pressable
                        key={c.id}
                        style={s.carte}
                        onLongPress={() => supprimer(c.id)}
                      >
                        <View style={s.horaire}>
                          <Text style={s.horaireDebut}>{c.debut}</Text>
                          <Text style={s.horaireFin}>{c.fin}</Text>
                        </View>
                        <View style={s.barreVerticale} />
                        <View style={s.flex}>
                          <Text style={s.carteTitre}>{c.intitule}</Text>
                          {c.salle && <Text style={s.carteDetail}>{c.salle}</Text>}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })
          )}

          {cours.length > 0 && (
            <Text style={s.astuce}>Appui long sur un cours pour le supprimer.</Text>
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
  accroche: { fontSize: 15, color: Colors.neutre.texte, marginTop: 4 },
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
  puces: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  puce: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Rayons.sm,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    backgroundColor: Colors.neutre.fond,
  },
  puceActive: { backgroundColor: Colors.prive.clair, borderColor: Colors.prive.base },
  puceTexte: { fontSize: 13, fontWeight: "600", color: Colors.neutre.texte },
  puceTexteActif: { color: Colors.prive.fonce },
  deuxColonnes: { flexDirection: "row", gap: Espacements.md },
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
  groupe: { marginTop: Espacements.lg },
  section: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
    marginBottom: Espacements.sm,
  },
  liste: { gap: Espacements.sm },
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
  horaire: { width: 46 },
  horaireDebut: { fontSize: 14, fontWeight: "700", color: Colors.neutre.encre },
  horaireFin: { fontSize: 12, color: Colors.neutre.discret, marginTop: 2 },
  barreVerticale: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: Colors.prive.base,
  },
  carteTitre: { fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  carteDetail: { fontSize: 13, color: Colors.neutre.discret, marginTop: 2 },
  astuce: {
    marginTop: Espacements.lg,
    fontSize: 12.5,
    color: Colors.neutre.discret,
    textAlign: "center",
  },
});
