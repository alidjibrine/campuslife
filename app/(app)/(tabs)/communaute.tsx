import { useCallback, useState } from "react";
import { Link, useFocusEffect, type Href } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  basculerJaime,
  CATEGORIES,
  depuis,
  listerPublications,
  MOTIFS_SIGNALEMENT,
  publier,
  signaler,
  supprimerPublication,
  type Publication,
} from "@/lib/communaute";
import { getMonProfil } from "@/lib/api";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Le fil de mon etablissement.
 *
 * Aucun filtre n'est applique ici sur l'ecole : c'est la base qui ne renvoie
 * que les publications de mon etablissement. Si un jour ce fil affiche une
 * publication d'une autre ecole, c'est une regle d'acces qui a saute, pas un
 * bug d'affichage.
 */
export default function Communaute() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [ecole, setEcole] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [composerOuvert, setComposerOuvert] = useState(false);
  const [categorie, setCategorie] = useState<string>(CATEGORIES[0]);
  const [contenu, setContenu] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const [p, profil] = await Promise.all([listerPublications(), getMonProfil()]);
      setPublications(p);
      setEcole(profil?.ecole?.nom ?? null);
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

  async function envoyer() {
    if (contenu.trim().length < 3 || enCours) return;
    setEnCours(true);
    try {
      await publier(categorie, contenu);
      setContenu("");
      setComposerOuvert(false);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  async function aimer(p: Publication) {
    setPublications((liste) =>
      liste.map((x) =>
        x.id === p.id
          ? { ...x, aimeParMoi: !x.aimeParMoi, jaime: x.jaime + (x.aimeParMoi ? -1 : 1) }
          : x,
      ),
    );
    try {
      await basculerJaime(p.id, p.aimeParMoi);
    } catch (e) {
      setErreur(messageErreur(e));
      await charger();
    }
  }

  function menu(p: Publication) {
    if (p.cestMoi) {
      Alert.alert("Ma publication", undefined, [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await supprimerPublication(p.id);
              await charger();
            } catch (e) {
              setErreur(messageErreur(e));
            }
          },
        },
      ]);
      return;
    }
    Alert.alert(
      "Signaler cette publication",
      "Pourquoi ce contenu pose problème ?",
      [
        { text: "Annuler", style: "cancel" },
        ...MOTIFS_SIGNALEMENT.map((m) => ({
          text: m.libelle,
          onPress: async () => {
            try {
              await signaler("post", p.id, m.cle);
              Alert.alert("Merci", "Le signalement a bien été enregistré.");
            } catch (e) {
              Alert.alert("Signalement", messageErreur(e));
            }
          },
        })),
      ],
    );
  }

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.contenu}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={rafraichit}
              onRefresh={() => {
                setRafraichit(true);
                charger();
              }}
              tintColor={Colors.social.base}
            />
          }
        >
          <View style={s.entete}>
            <View style={s.flex}>
              <Text style={s.titre}>Communauté</Text>
              <Text style={s.sousTitre}>{ecole ?? "Mon établissement"}</Text>
            </View>
            <Link href={"/membres" as Href} asChild>
              <Pressable style={s.boutonMembres}>
                <Ionicons name="people-outline" size={18} color={Colors.social.fonce} />
              </Pressable>
            </Link>
          </View>

          {!composerOuvert && (
            <Pressable style={s.invite} onPress={() => setComposerOuvert(true)}>
              <Text style={s.inviteTexte}>Poser une question, partager un bon plan...</Text>
            </Pressable>
          )}

          {composerOuvert && (
            <View style={s.composer}>
              <View style={s.puces}>
                {CATEGORIES.map((c) => {
                  const actif = categorie === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCategorie(c)}
                      disabled={enCours}
                      style={[s.puce, actif && s.puceActive]}
                    >
                      <Text style={[s.puceTexte, actif && s.puceTexteActif]}>{c}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                style={s.champ}
                value={contenu}
                onChangeText={setContenu}
                placeholder="Ce que tu veux dire à ta promo"
                placeholderTextColor={Colors.neutre.discret}
                multiline
                editable={!enCours}
              />
              <View style={s.actions}>
                <Pressable
                  style={s.annuler}
                  onPress={() => {
                    setComposerOuvert(false);
                    setContenu("");
                  }}
                  disabled={enCours}
                >
                  <Text style={s.annulerTexte}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[s.valider, contenu.trim().length < 3 && s.inactif]}
                  onPress={envoyer}
                  disabled={contenu.trim().length < 3 || enCours}
                >
                  {enCours ? (
                    <ActivityIndicator color={Colors.neutre.blanc} />
                  ) : (
                    <Text style={s.validerTexte}>Publier</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

          {chargement ? (
            <ActivityIndicator style={s.attente} size="large" color={Colors.social.base} />
          ) : publications.length === 0 ? (
            <View style={s.vide}>
              <Text style={s.videTitre}>Le fil est vide</Text>
              <Text style={s.videTexte}>
                Personne n&apos;a encore publié dans ton école. Lance la première
                discussion, c&apos;est toujours quelqu&apos;un qui commence.
              </Text>
            </View>
          ) : (
            <View style={s.liste}>
              {publications.map((p) => (
                <View key={p.id} style={s.carte}>
                  <View style={s.carteEntete}>
                    <View style={s.avatar}>
                      <Text style={s.avatarTexte}>
                        {p.auteurNom.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={s.flex}>
                      <Text style={s.auteur}>{p.auteurNom}</Text>
                      <Text style={s.date}>
                        {depuis(p.creeLe)}
                        {p.categorie ? " · " + p.categorie : ""}
                      </Text>
                    </View>
                    <Pressable onPress={() => menu(p)} hitSlop={10}>
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={18}
                        color={Colors.neutre.discret}
                      />
                    </Pressable>
                  </View>

                  <Text style={s.texte}>{p.contenu}</Text>

                  <View style={s.pied}>
                    <Pressable style={s.action} onPress={() => aimer(p)} hitSlop={8}>
                      <Ionicons
                        name={p.aimeParMoi ? "heart" : "heart-outline"}
                        size={17}
                        color={p.aimeParMoi ? Colors.etat.erreur : Colors.neutre.discret}
                      />
                      <Text style={[s.actionTexte, p.aimeParMoi && s.actionActive]}>
                        {p.jaime}
                      </Text>
                    </Pressable>
                    <Link
                      href={("/sujet/" + p.id) as Href}
                      asChild
                    >
                      <Pressable style={s.action} hitSlop={8}>
                        <Ionicons
                          name="chatbubble-outline"
                          size={16}
                          color={Colors.neutre.discret}
                        />
                        <Text style={s.actionTexte}>
                          {p.commentaires === 0
                            ? "Répondre"
                            : p.commentaires +
                              (p.commentaires > 1 ? " réponses" : " réponse")}
                        </Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              ))}
            </View>
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
  entete: { flexDirection: "row", alignItems: "center", gap: Espacements.md },
  titre: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.neutre.encre,
  },
  sousTitre: { fontSize: 13.5, color: Colors.social.fonce, marginTop: 2, fontWeight: "600" },
  boutonMembres: {
    width: 40,
    height: 40,
    borderRadius: Rayons.md,
    backgroundColor: Colors.social.clair,
    alignItems: "center",
    justifyContent: "center",
  },
  invite: {
    marginTop: Espacements.lg,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    backgroundColor: Colors.neutre.surface,
    paddingHorizontal: Espacements.md,
    paddingVertical: 14,
  },
  inviteTexte: { fontSize: 14.5, color: Colors.neutre.discret },
  composer: {
    marginTop: Espacements.lg,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.social.base,
    borderRadius: Rayons.lg,
    padding: Espacements.md,
  },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: Espacements.sm },
  puce: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Rayons.sm,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
  },
  puceActive: { backgroundColor: Colors.social.clair, borderColor: Colors.social.base },
  puceTexte: { fontSize: 13, fontWeight: "600", color: Colors.neutre.texte },
  puceTexteActif: { color: Colors.social.fonce },
  champ: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    padding: Espacements.md,
    fontSize: 15,
    color: Colors.neutre.encre,
    backgroundColor: Colors.neutre.fond,
    textAlignVertical: "top",
  },
  actions: { flexDirection: "row", gap: Espacements.sm, marginTop: Espacements.md },
  annuler: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Rayons.md,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    alignItems: "center",
  },
  annulerTexte: { fontSize: 15, fontWeight: "600", color: Colors.neutre.texte },
  valider: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Rayons.md,
    backgroundColor: Colors.social.fonce,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  validerTexte: { fontSize: 15, fontWeight: "700", color: Colors.neutre.blanc },
  inactif: { opacity: 0.4 },
  erreur: { marginTop: Espacements.md, fontSize: 14, color: Colors.etat.erreur },
  attente: { marginTop: Espacements.xl },
  vide: {
    marginTop: Espacements.lg,
    padding: Espacements.lg,
    borderRadius: Rayons.lg,
    backgroundColor: Colors.social.clair,
  },
  videTitre: { fontSize: 15, fontWeight: "700", color: Colors.social.fonce },
  videTexte: { fontSize: 14, color: Colors.neutre.texte, marginTop: 4, lineHeight: 20 },
  liste: { marginTop: Espacements.lg, gap: Espacements.sm },
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
  avatarTexte: { fontSize: 14, fontWeight: "800", color: Colors.social.fonce },
  auteur: { fontSize: 14.5, fontWeight: "700", color: Colors.neutre.encre },
  date: { fontSize: 12, color: Colors.neutre.discret, marginTop: 1 },
  texte: {
    fontSize: 15,
    color: Colors.neutre.encre,
    lineHeight: 22,
    marginTop: Espacements.sm,
  },
  pied: {
    flexDirection: "row",
    gap: Espacements.lg,
    marginTop: Espacements.md,
    paddingTop: Espacements.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.trait,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionTexte: { fontSize: 13, color: Colors.neutre.discret, fontWeight: "600" },
  actionActive: { color: Colors.etat.erreur },
});
