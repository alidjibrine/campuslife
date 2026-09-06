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
  basculerDevoir,
  creerDevoir,
  formaterDate,
  joursRestants,
  listerDevoirs,
  supprimerDevoir,
  type Devoir,
} from "@/lib/etudes";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Mes devoirs.
 *
 * Tries par echeance, les faits repousses en bas. L'ajout se fait dans un
 * formulaire qui se deplie sur place : pas de navigation, pas d'ecran de plus.
 *
 * L'echeance se saisit en JJ/MM, l'annee est deduite. Un etudiant ne tape pas
 * "2026-09-12" a la main.
 */
export default function Devoirs() {
  const router = useRouter();
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [chargement, setChargement] = useState(true);
  const [formOuvert, setFormOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [matiere, setMatiere] = useState("");
  const [echeance, setEcheance] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setDevoirs(await listerDevoirs());
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

  /** "12/09" devient "2026-09-12". Si la date est passee, on vise l'an prochain. */
  function versIso(saisie: string): string | null {
    const m = saisie.trim().match(/^(\d{1,2})[/.-](\d{1,2})$/);
    if (!m) return null;
    const jour = Number(m[1]);
    const mois = Number(m[2]);
    if (jour < 1 || jour > 31 || mois < 1 || mois > 12) return null;
    const maintenant = new Date();
    let annee = maintenant.getFullYear();
    const essai = new Date(annee, mois - 1, jour, 12);
    if (essai.getTime() < maintenant.getTime() - 86400000) annee += 1;
    return (
      annee +
      "-" +
      String(mois).padStart(2, "0") +
      "-" +
      String(jour).padStart(2, "0")
    );
  }

  const echeanceIso = echeance.trim() ? versIso(echeance) : null;
  const echeanceInvalide = echeance.trim().length > 0 && echeanceIso === null;
  const peutValider = titre.trim().length > 1 && !echeanceInvalide && !enCours;

  async function ajouter() {
    if (!peutValider) return;
    setEnCours(true);
    try {
      await creerDevoir({
        titre,
        matiere: matiere || null,
        echeance: echeanceIso,
      });
      setTitre("");
      setMatiere("");
      setEcheance("");
      setFormOuvert(false);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  async function basculer(d: Devoir) {
    setDevoirs((liste) =>
      liste.map((x) => (x.id === d.id ? { ...x, fait: !x.fait } : x)),
    );
    try {
      await basculerDevoir(d.id, !d.fait);
    } catch (e) {
      setErreur(messageErreur(e));
      await charger();
    }
  }

  async function supprimer(id: string) {
    setDevoirs((liste) => liste.filter((x) => x.id !== id));
    try {
      await supprimerDevoir(id);
    } catch (e) {
      setErreur(messageErreur(e));
      await charger();
    }
  }

  const aFaire = devoirs.filter((d) => !d.fait);
  const faits = devoirs.filter((d) => d.fait);

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

          <Text style={s.titre}>Mes devoirs</Text>
          <Text style={s.accroche}>
            {aFaire.length === 0
              ? "Rien a rendre pour l'instant."
              : aFaire.length + (aFaire.length > 1 ? " devoirs a rendre." : " devoir a rendre.")}
          </Text>

          {!formOuvert && (
            <Pressable style={s.ajout} onPress={() => setFormOuvert(true)}>
              <Text style={s.ajoutTexte}>Ajouter un devoir</Text>
            </Pressable>
          )}

          {formOuvert && (
            <View style={s.form}>
              <Text style={s.label}>Quoi</Text>
              <TextInput
                style={s.champ}
                value={titre}
                onChangeText={setTitre}
                placeholder="Dissertation sur les obligations"
                placeholderTextColor={Colors.neutre.discret}
                editable={!enCours}
              />

              <Text style={[s.label, s.espace]}>Matiere</Text>
              <TextInput
                style={s.champ}
                value={matiere}
                onChangeText={setMatiere}
                placeholder="Droit civil"
                placeholderTextColor={Colors.neutre.discret}
                editable={!enCours}
              />

              <Text style={[s.label, s.espace]}>Pour quand</Text>
              <TextInput
                style={[s.champ, echeanceInvalide && s.champInvalide]}
                value={echeance}
                onChangeText={setEcheance}
                placeholder="12/09"
                placeholderTextColor={Colors.neutre.discret}
                keyboardType="numbers-and-punctuation"
                editable={!enCours}
              />
              <Text style={s.aide}>
                {echeanceInvalide
                  ? "Format attendu : jour/mois, par exemple 12/09."
                  : echeanceIso
                    ? "Echeance : " + formaterDate(echeanceIso)
                    : "Jour/mois. Laisse vide s'il n'y a pas de date."}
              </Text>

              <View style={s.actions}>
                <Pressable
                  style={s.annuler}
                  onPress={() => {
                    setFormOuvert(false);
                    setTitre("");
                    setMatiere("");
                    setEcheance("");
                  }}
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
            <ActivityIndicator
              style={s.attente}
              size="large"
              color={Colors.prive.base}
            />
          ) : (
            <>
              <View style={s.liste}>
                {aFaire.map((d) => {
                  const jours = joursRestants(d.echeance);
                  const enRetard = jours !== null && jours < 0;
                  const urgent = jours !== null && jours >= 0 && jours <= 2;
                  return (
                    <Pressable
                      key={d.id}
                      style={s.carte}
                      onPress={() => basculer(d)}
                      onLongPress={() => supprimer(d.id)}
                    >
                      <View style={s.case_} />
                      <View style={s.flex}>
                        <Text style={s.carteTitre}>{d.titre}</Text>
                        <Text style={s.carteDetail}>
                          {d.matiere ? d.matiere + " · " : ""}
                          {formaterDate(d.echeance)}
                        </Text>
                      </View>
                      {jours !== null && (
                        <Text
                          style={[
                            s.badge,
                            enRetard && s.badgeRetard,
                            urgent && s.badgeUrgent,
                          ]}
                        >
                          {enRetard
                            ? "en retard"
                            : jours === 0
                              ? "aujourd'hui"
                              : "J-" + jours}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {aFaire.length === 0 && !chargement && (
                <View style={s.vide}>
                  <Text style={s.videTitre}>Aucun devoir en attente</Text>
                  <Text style={s.videTexte}>
                    Ajoute ce que tu dois rendre, tu le retrouveras sur ton QG.
                  </Text>
                </View>
              )}

              {faits.length > 0 && (
                <>
                  <Text style={s.section}>Termines</Text>
                  <View style={s.liste}>
                    {faits.map((d) => (
                      <Pressable
                        key={d.id}
                        style={[s.carte, s.carteFaite]}
                        onPress={() => basculer(d)}
                        onLongPress={() => supprimer(d.id)}
                      >
                        <View style={[s.case_, s.caseCochee]}>
                          <Text style={s.coche}>OK</Text>
                        </View>
                        <View style={s.flex}>
                          <Text style={[s.carteTitre, s.barre]}>{d.titre}</Text>
                          <Text style={s.carteDetail}>
                            {d.matiere ?? "sans matiere"}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              <Text style={s.astuce}>
                Touche un devoir pour le cocher. Appui long pour le supprimer.
              </Text>
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
  titre: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.neutre.encre,
  },
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
  champInvalide: { borderColor: Colors.etat.erreur },
  aide: { fontSize: 12.5, color: Colors.neutre.discret, marginTop: 6 },
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
  erreur: {
    marginTop: Espacements.md,
    fontSize: 14,
    color: Colors.etat.erreur,
    lineHeight: 20,
  },
  attente: { marginTop: Espacements.xl },
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
  carteFaite: { opacity: 0.6 },
  case_: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.neutre.discret,
    alignItems: "center",
    justifyContent: "center",
  },
  caseCochee: {
    backgroundColor: Colors.social.base,
    borderColor: Colors.social.base,
  },
  coche: { color: Colors.neutre.blanc, fontSize: 9, fontWeight: "800" },
  carteTitre: { fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  barre: { textDecorationLine: "line-through" },
  carteDetail: { fontSize: 13, color: Colors.neutre.discret, marginTop: 2 },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.neutre.discret,
  },
  badgeUrgent: { color: Colors.etat.alerte },
  badgeRetard: { color: Colors.etat.erreur },
  vide: {
    marginTop: Espacements.lg,
    padding: Espacements.lg,
    borderRadius: Rayons.lg,
    backgroundColor: Colors.prive.clair,
  },
  videTitre: { fontSize: 15, fontWeight: "700", color: Colors.prive.fonce },
  videTexte: {
    fontSize: 14,
    color: Colors.neutre.texte,
    marginTop: 4,
    lineHeight: 20,
  },
  section: {
    marginTop: Espacements.xl,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
  },
  astuce: {
    marginTop: Espacements.lg,
    fontSize: 12.5,
    color: Colors.neutre.discret,
    textAlign: "center",
  },
});
