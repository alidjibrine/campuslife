import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import {
  changeDeJour,
  ecouterMessages,
  envoyer,
  formaterHeure,
  libelleJour,
  listerConversations,
  listerMessages,
  marquerLu,
  monIdentifiant,
  supprimerMessage,
  type Message,
} from "@/lib/messages";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Une discussion a deux.
 *
 * Les messages arrivent en direct par le canal Supabase. On ajoute quand meme
 * le message envoye tout de suite dans la liste sans attendre le retour du
 * canal : sur un reseau lent, voir son propre message partir immediatement
 * change tout. Le doublon eventuel est filtre par identifiant.
 */
export default function ConversationEcran() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const liste = useRef<ScrollView>(null);

  const [monId, setMonId] = useState<string | null>(null);
  const [titre, setTitre] = useState("Conversation");
  const [sousTitre, setSousTitre] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [brouillon, setBrouillon] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const ajouter = useCallback((m: Message) => {
    setMessages((actuels) =>
      actuels.some((x) => x.id === m.id) ? actuels : [...actuels, m],
    );
  }, []);

  useEffect(() => {
    if (!id) return;
    let vivant = true;

    (async () => {
      try {
        const [identifiant, conversations, historique] = await Promise.all([
          monIdentifiant(),
          listerConversations(),
          listerMessages(id),
        ]);
        if (!vivant) return;
        const conv = conversations.find((c) => c.id === id);
        setMonId(identifiant);
        setTitre(conv?.autreNom ?? "Conversation");
        setSousTitre(conv?.autreFiliere ?? null);
        setMessages(historique);
        setErreur(null);
        await marquerLu(id);
      } catch (e) {
        if (vivant) setErreur(messageErreur(e));
      } finally {
        if (vivant) setChargement(false);
      }
    })();

    return () => {
      vivant = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !monId) return;
    const couper = ecouterMessages(id, monId, (m) => {
      ajouter(m);
      if (!m.cestMoi) marquerLu(id).catch(() => {});
    });
    return couper;
  }, [id, monId, ajouter]);

  useEffect(() => {
    const t = setTimeout(() => liste.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length]);

  async function envoyerMessage() {
    const texte = brouillon.trim();
    if (!texte || !id || envoiEnCours) return;
    setEnvoiEnCours(true);
    setBrouillon("");
    try {
      ajouter(await envoyer(id, texte));
      setErreur(null);
    } catch (e) {
      setBrouillon(texte);
      setErreur(messageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function menu(m: Message) {
    if (!m.cestMoi) return;
    Alert.alert("Ce message", undefined, [
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await supprimerMessage(m.id);
            setMessages((actuels) => actuels.filter((x) => x.id !== m.id));
          } catch (e) {
            setErreur(messageErreur(e));
          }
        },
      },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  return (
    <SafeAreaView style={s.page} edges={["top", "left", "right"]}>
      <View style={s.entete}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.retour}>Retour</Text>
        </Pressable>
        <View style={s.flex}>
          <Text style={s.titre} numberOfLines={1}>
            {titre}
          </Text>
          {!!sousTitre && (
            <Text style={s.sousTitre} numberOfLines={1}>
              {sousTitre}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {chargement ? (
          <ActivityIndicator style={s.attente} size="large" color={Colors.social.base} />
        ) : (
          <ScrollView
            ref={liste}
            contentContainerStyle={s.fil}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && (
              <View style={s.vide}>
                <Text style={s.videTitre}>Rien pour l'instant</Text>
                <Text style={s.videTexte}>
                  Écris le premier message. Personne d'autre que vous deux ne le lira.
                </Text>
              </View>
            )}

            {messages.map((m, i) => (
              <View key={m.id}>
                {changeDeJour(m, messages[i - 1]) && (
                  <Text style={s.jour}>{libelleJour(m.creeLe)}</Text>
                )}
                <Pressable
                  onLongPress={() => menu(m)}
                  style={[s.bulle, m.cestMoi ? s.bulleMoi : s.bulleAutre]}
                >
                  <Text style={[s.texte, m.cestMoi && s.texteMoi]}>{m.contenu}</Text>
                  <Text style={[s.heure, m.cestMoi && s.heureMoi]}>
                    {formaterHeure(m.creeLe)}
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

        <View style={s.barre}>
          <TextInput
            style={s.champ}
            value={brouillon}
            onChangeText={setBrouillon}
            placeholder="Écrire un message"
            placeholderTextColor={Colors.neutre.discret}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[s.envoi, (!brouillon.trim() || envoiEnCours) && s.envoiInactif]}
            onPress={envoyerMessage}
            disabled={!brouillon.trim() || envoiEnCours}
          >
            <Text style={s.envoiTexte}>{envoiEnCours ? "..." : "Envoyer"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  flex: { flex: 1 },
  entete: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.md,
    paddingHorizontal: Espacements.lg,
    paddingVertical: Espacements.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutre.trait,
    backgroundColor: Colors.neutre.surface,
  },
  retour: { fontSize: 14, fontWeight: "600", color: Colors.social.fonce },
  titre: { fontSize: 17, fontWeight: "800", color: Colors.neutre.encre },
  sousTitre: { fontSize: 12.5, color: Colors.neutre.discret, marginTop: 1 },
  attente: { marginTop: Espacements.xl },
  fil: {
    padding: Espacements.lg,
    paddingBottom: Espacements.md,
    gap: 6,
  },
  vide: {
    padding: Espacements.lg,
    borderRadius: Rayons.lg,
    backgroundColor: Colors.social.clair,
  },
  videTitre: { fontSize: 15, fontWeight: "700", color: Colors.social.fonce },
  videTexte: {
    fontSize: 14,
    color: Colors.neutre.texte,
    marginTop: 4,
    lineHeight: 20,
  },
  jour: {
    alignSelf: "center",
    marginVertical: Espacements.md,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "capitalize",
  },
  bulle: {
    maxWidth: "82%",
    paddingHorizontal: Espacements.md,
    paddingVertical: 9,
    borderRadius: Rayons.md,
    marginTop: 4,
  },
  bulleMoi: {
    alignSelf: "flex-end",
    backgroundColor: Colors.social.base,
    borderBottomRightRadius: 4,
  },
  bulleAutre: {
    alignSelf: "flex-start",
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderBottomLeftRadius: 4,
  },
  texte: { fontSize: 15, lineHeight: 21, color: Colors.neutre.encre },
  texteMoi: { color: "#FFFFFF" },
  heure: {
    fontSize: 10.5,
    marginTop: 3,
    alignSelf: "flex-end",
    color: Colors.neutre.discret,
  },
  heureMoi: { color: "rgba(255,255,255,0.75)" },
  erreur: {
    paddingHorizontal: Espacements.lg,
    paddingBottom: Espacements.sm,
    fontSize: 13.5,
    color: Colors.etat.erreur,
  },
  barre: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Espacements.sm,
    paddingHorizontal: Espacements.lg,
    paddingTop: Espacements.sm,
    paddingBottom: Espacements.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.trait,
    backgroundColor: Colors.neutre.surface,
  },
  champ: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    paddingHorizontal: Espacements.md,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.neutre.encre,
    backgroundColor: Colors.neutre.fond,
  },
  envoi: {
    paddingHorizontal: Espacements.md,
    paddingVertical: 12,
    borderRadius: Rayons.sm,
    backgroundColor: Colors.social.base,
  },
  envoiInactif: { backgroundColor: Colors.neutre.trait },
  envoiTexte: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
