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
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Import de l'emploi du temps.
 *
 * L'etudiant colle le lien d'agenda fourni par son universite, ADE ou Celcat,
 * et sa semaine se remplit. Aucune ecole n'a besoin de donner son accord :
 * ces liens sont deja publies pour etre synchronises dans un agenda.
 */
export default function EmploiDuTemps() {
  const router = useRouter();
  const [sources, setSources] = useState<SourceAgenda[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [decalageSemaine, setDecalageSemaine] = useState(0);
  const [chargement, setChargement] = useState(true);
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
      const [s, e] = await Promise.all([
        listerSources(),
        listerSeances(lundi, dimanche),
      ]);
      setSources(s);
      setSeances(e);
      setErreur(null);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
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
    try {
      const source = await ajouterSourceLien(lien, libelle);
      const nombre = await synchroniser(source);
      setInfo(nombre + " séances importées.");
      setLien("");
      setLibelle("");
      setFormOuvert(false);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
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

  async function retirer(id: string) {
    setEnCours(true);
    try {
      await supprimerSource(id);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  // Regroupement des seances par jour de la semaine affichee.
  const parJour: { jour: Date; seances: Seance[] }[] = [];
  for (let i = 0; i < 7; i += 1) {
    const jour = new Date(lundi);
    jour.setDate(jour.getDate() + i);
    const duJour = seances.filter(
      (s) => s.debut.toDateString() === jour.toDateString(),
    );
    if (duJour.length > 0) parJour.push({ jour, seances: duJour });
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

          <Text style={s.titre}>Mon emploi du temps</Text>

          {sources.length === 0 && !chargement && (
            <View style={s.explication}>
              <Text style={s.explicationTitre}>Colle le lien de ton agenda</Text>
              <Text style={s.explicationTexte}>
                Ton université publie déjà ton emploi du temps sous forme de lien
                à synchroniser, depuis ADE ou Celcat. Cherche
                &quot;exporter mon agenda&quot; sur ton espace numérique, copie le
                lien qui se termine par .ics, et colle-le ici. Ta semaine se
                remplit toute seule.
              </Text>
            </View>
          )}

          {sources.map((source) => (
            <View key={source.id} style={s.source}>
              <View style={s.flex}>
                <Text style={s.sourceLibelle}>{source.libelle}</Text>
                <Text style={s.sourceDetail} numberOfLines={1}>
                  {source.nombreSeances} seances
                  {source.derniereSynchro
                    ? " · maj " +
                      new Date(source.derniereSynchro).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })
                    : " · jamais synchronisé"}
                </Text>
                {!!source.dernierStatut && source.dernierStatut !== "ok" && (
                  <Text style={s.sourceErreur}>{source.dernierStatut}</Text>
                )}
              </View>
              <Pressable
                style={s.boutonSecondaire}
                onPress={() => mettreAJour(source)}
                onLongPress={() => retirer(source.id)}
                disabled={enCours}
              >
                <Text style={s.boutonSecondaireTexte}>Mettre à jour</Text>
              </Pressable>
            </View>
          ))}

          {!formOuvert && (
            <Pressable style={s.ajout} onPress={() => setFormOuvert(true)}>
              <Text style={s.ajoutTexte}>
                {sources.length === 0 ? "Ajouter mon agenda" : "Ajouter un autre agenda"}
              </Text>
            </Pressable>
          )}

          {formOuvert && (
            <View style={s.form}>
              <Text style={s.label}>Lien de l&apos;agenda</Text>
              <TextInput
                style={s.champ}
                value={lien}
                onChangeText={setLien}
                placeholder="https://ade.unistra.fr/...ical"
                placeholderTextColor={Colors.neutre.discret}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!enCours}
              />
              <Text style={s.aide}>
                Les liens en webcal:// fonctionnent aussi, ils sont convertis.
              </Text>

              <Text style={[s.label, s.espace]}>Nom</Text>
              <TextInput
                style={s.champ}
                value={libelle}
                onChangeText={setLibelle}
                placeholder="Mon emploi du temps"
                placeholderTextColor={Colors.neutre.discret}
                editable={!enCours}
              />

              <View style={s.actions}>
                <Pressable
                  style={s.annuler}
                  onPress={() => setFormOuvert(false)}
                  disabled={enCours}
                >
                  <Text style={s.annulerTexte}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[s.valider, lien.trim().length < 8 && s.inactif]}
                  onPress={ajouter}
                  disabled={lien.trim().length < 8 || enCours}
                >
                  {enCours ? (
                    <ActivityIndicator color={Colors.neutre.blanc} />
                  ) : (
                    <Text style={s.validerTexte}>Importer</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {!!erreur && <Text style={s.erreur}>{erreur}</Text>}
          {!!info && <Text style={s.info}>{info}</Text>}

          <View style={s.navigation}>
            <Pressable
              style={s.fleche}
              onPress={() => setDecalageSemaine((n) => n - 1)}
              disabled={enCours}
            >
              <Text style={s.flecheTexte}>Semaine précédente</Text>
            </Pressable>
            {decalageSemaine !== 0 && (
              <Pressable style={s.fleche} onPress={() => setDecalageSemaine(0)}>
                <Text style={s.flecheTexte}>Cette semaine</Text>
              </Pressable>
            )}
            <Pressable
              style={s.fleche}
              onPress={() => setDecalageSemaine((n) => n + 1)}
              disabled={enCours}
            >
              <Text style={s.flecheTexte}>Suivante</Text>
            </Pressable>
          </View>

          {chargement ? (
            <ActivityIndicator style={s.attente} size="large" color={Colors.prive.base} />
          ) : parJour.length === 0 ? (
            <View style={s.vide}>
              <Text style={s.videTitre}>Aucune séance cette semaine</Text>
              <Text style={s.videTexte}>
                Soit l&apos;agenda n&apos;est pas encore importé, soit la semaine
                est vraiment vide. Les vacances existent.
              </Text>
            </View>
          ) : (
            parJour.map(({ jour, seances: duJour }) => (
              <View key={jour.toISOString()} style={s.groupe}>
                <Text style={s.section}>{formaterJourLong(jour)}</Text>
                <View style={s.liste}>
                  {duJour.map((seance) => (
                    <View key={seance.id} style={s.carte}>
                      <View style={s.horaire}>
                        <Text style={s.horaireDebut}>{formaterHeure(seance.debut)}</Text>
                        <Text style={s.horaireFin}>{formaterHeure(seance.fin)}</Text>
                      </View>
                      <View style={s.barreVerticale} />
                      <View style={s.flex}>
                        <Text style={s.carteTitre}>{seance.intitule}</Text>
                        {!!seance.salle && (
                          <Text style={s.carteDetail}>{seance.salle}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}

          {sources.length > 0 && (
            <Text style={s.astuce}>
              Appui long sur &quot;Mettre à jour&quot; pour supprimer un agenda et
              toutes ses séances.
            </Text>
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
  explication: {
    marginTop: Espacements.lg,
    backgroundColor: Colors.prive.clair,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
  },
  explicationTitre: { fontSize: 15, fontWeight: "700", color: Colors.prive.fonce },
  explicationTexte: {
    fontSize: 14,
    color: Colors.neutre.texte,
    marginTop: 6,
    lineHeight: 21,
  },
  source: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.md,
    marginTop: Espacements.lg,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    padding: Espacements.md,
  },
  sourceLibelle: { fontSize: 15, fontWeight: "700", color: Colors.neutre.encre },
  sourceDetail: { fontSize: 12.5, color: Colors.neutre.discret, marginTop: 2 },
  sourceErreur: { fontSize: 12.5, color: Colors.etat.erreur, marginTop: 4 },
  boutonSecondaire: {
    paddingHorizontal: Espacements.md,
    paddingVertical: 9,
    borderRadius: Rayons.sm,
    borderWidth: 1,
    borderColor: Colors.prive.base,
  },
  boutonSecondaireTexte: { fontSize: 12.5, fontWeight: "700", color: Colors.prive.fonce },
  ajout: {
    marginTop: Espacements.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.prive.base,
    borderRadius: Rayons.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  ajoutTexte: { fontSize: 15, fontWeight: "700", color: Colors.prive.fonce },
  form: {
    marginTop: Espacements.md,
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
    fontSize: 15,
    color: Colors.neutre.encre,
    backgroundColor: Colors.neutre.fond,
  },
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
  info: { marginTop: Espacements.md, fontSize: 14, color: Colors.social.fonce },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Espacements.sm,
    marginTop: Espacements.xl,
  },
  fleche: {
    paddingHorizontal: Espacements.md,
    paddingVertical: 8,
    borderRadius: Rayons.sm,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
  },
  flecheTexte: { fontSize: 12.5, fontWeight: "600", color: Colors.neutre.texte },
  attente: { marginTop: Espacements.xl },
  vide: {
    marginTop: Espacements.lg,
    padding: Espacements.lg,
    borderRadius: Rayons.lg,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
  },
  videTitre: { fontSize: 15, fontWeight: "700", color: Colors.neutre.encre },
  videTexte: { fontSize: 14, color: Colors.neutre.texte, marginTop: 4, lineHeight: 20 },
  groupe: { marginTop: Espacements.lg },
  section: {
    fontSize: 12,
    letterSpacing: 1.2,
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
  horaire: { width: 48 },
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
