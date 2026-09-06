import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
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
import { Ionicons } from "@expo/vector-icons";
import {
  commenter,
  depuis,
  listerCommentaires,
  listerPublications,
  MOTIFS_SIGNALEMENT,
  signaler,
  supprimerCommentaire,
  type Commentaire,
  type Publication,
} from "@/lib/communaute";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/** Une publication et ses reponses. */
export default function Sujet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [reponse, setReponse] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    try {
      const [liste, c] = await Promise.all([
        listerPublications(),
        listerCommentaires(id),
      ]);
      setPublication(liste.find((p) => p.id === id) ?? null);
      setCommentaires(c);
      setErreur(null);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  async function envoyer() {
    if (!id || reponse.trim().length < 2 || enCours) return;
    setEnCours(true);
    try {
      await commenter(id, reponse);
      setReponse("");
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  function menuCommentaire(c: Commentaire) {
    if (c.cestMoi) {
      Alert.alert("Ma reponse", undefined, [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await supprimerCommentaire(c.id);
              await charger();
            } catch (e) {
              setErreur(messageErreur(e));
            }
          },
        },
      ]);
      return;
    }
    Alert.alert("Signaler cette reponse", "Pourquoi ce contenu pose probleme ?", [
      { text: "Annuler", style: "cancel" },
      ...MOTIFS_SIGNALEMENT.map((m) => ({
        text: m.libelle,
        onPress: async () => {
          try {
            await signaler("comment", c.id, m.cle);
            Alert.alert("Merci", "Le signalement a bien ete enregistre.");
          } catch (e) {
            Alert.alert("Signalement", messageErreur(e));
          }
        },
      })),
    ]);
  }

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={s.retour}>
            <Text style={s.retourTexte}>Retour au fil</Text>
          </Pressable>

          {chargement ? (
            <ActivityIndicator style={s.attente} size="large" color={Colors.social.base} />
          ) : !publication ? (
            <Text style={s.vide}>
              Cette publication n&apos;existe plus, ou elle appartient a une autre
              ecole.
            </Text>
          ) : (
            <>
              <View style={s.carte}>
                <View style={s.carteEntete}>
                  <View style={s.avatar}>
                    <Text style={s.avatarTexte}>
                      {publication.auteurNom.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.flex}>
                    <Text style={s.auteur}>{publication.auteurNom}</Text>
                    <Text style={s.date}>
                      {depuis(publication.creeLe)}
                      {publication.categorie ? " · " + publication.categorie : ""}
                    </Text>
                  </View>
                </View>
                <Text style={s.texte}>{publication.contenu}</Text>
              </View>

              <Text style={s.section}>
                {commentaires.length === 0
                  ? "Aucune reponse"
                  : commentaires.length +
                    (commentaires.length > 1 ? " reponses" : " reponse")}
              </Text>

              <View style={s.liste}>
                {commentaires.map((c) => (
                  <View key={c.id} style={s.reponseCarte}>
                    <View style={s.carteEntete}>
                      <View style={[s.avatar, s.avatarPetit]}>
                        <Text style={s.avatarTexte}>
                          {c.auteurNom.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={s.flex}>
                        <Text style={s.auteurPetit}>{c.auteurNom}</Text>
                        <Text style={s.date}>{depuis(c.creeLe)}</Text>
                      </View>
                      <Pressable onPress={() => menuCommentaire(c)} hitSlop={10}>
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={16}
                          color={Colors.neutre.discret}
                        />
                      </Pressable>
                    </View>
                    <Text style={s.reponseTexte}>{c.contenu}</Text>
                  </View>
                ))}
              </View>

              {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

              <View style={s.zoneReponse}>
                <TextInput
                  style={s.champ}
                  value={reponse}
                  onChangeText={setReponse}
                  placeholder="Ecrire une reponse"
                  placeholderTextColor={Colors.neutre.discret}
                  multiline
                  editable={!enCours}
                />
                <Pressable
                  style={[s.envoyer, reponse.trim().length < 2 && s.inactif]}
                  onPress={envoyer}
                  disabled={reponse.trim().length < 2 || enCours}
                >
                  {enCours ? (
                    <ActivityIndicator color={Colors.neutre.blanc} />
                  ) : (
                    <Ionicons name="arrow-up" size={20} color={Colors.neutre.blanc} />
                  )}
                </Pressable>
              </View>
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
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl },
  retour: { marginBottom: Espacements.md },
  retourTexte: { fontSize: 14, fontWeight: "600", color: Colors.social.fonce },
  attente: { marginTop: Espacements.xl },
  vide: { fontSize: 15, color: Colors.neutre.texte, marginTop: Espacements.lg },
  carte: {
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.lg,
    padding: Espacements.md,
  },
  carteEntete: { flexDirection: "row", alignItems: "center", gap: Espacements.sm },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.social.clair,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPetit: { width: 28, height: 28, borderRadius: 14 },
  avatarTexte: { fontSize: 13, fontWeight: "800", color: Colors.social.fonce },
  auteur: { fontSize: 14.5, fontWeight: "700", color: Colors.neutre.encre },
  auteurPetit: { fontSize: 13.5, fontWeight: "700", color: Colors.neutre.encre },
  date: { fontSize: 12, color: Colors.neutre.discret, marginTop: 1 },
  texte: {
    fontSize: 15.5,
    color: Colors.neutre.encre,
    lineHeight: 23,
    marginTop: Espacements.sm,
  },
  section: {
    marginTop: Espacements.xl,
    marginBottom: Espacements.sm,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
  },
  liste: { gap: Espacements.sm },
  reponseCarte: {
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    padding: Espacements.md,
  },
  reponseTexte: {
    fontSize: 14.5,
    color: Colors.neutre.texte,
    lineHeight: 21,
    marginTop: 6,
  },
  erreur: { marginTop: Espacements.md, fontSize: 14, color: Colors.etat.erreur },
  zoneReponse: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Espacements.sm,
    marginTop: Espacements.lg,
  },
  champ: {
    flex: 1,
    minHeight: 46,
    maxHeight: 130,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    paddingHorizontal: Espacements.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.neutre.encre,
    backgroundColor: Colors.neutre.surface,
    textAlignVertical: "top",
  },
  envoyer: {
    width: 46,
    height: 46,
    borderRadius: Rayons.md,
    backgroundColor: Colors.social.fonce,
    alignItems: "center",
    justifyContent: "center",
  },
  inactif: { opacity: 0.4 },
});
