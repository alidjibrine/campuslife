import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Champ from "@/components/Champ";
import Avatar from "@/components/Avatar";
import Alerte from "@/components/Alerte";
import Squelette from "@/components/Squelette";
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
import { Colors, Espacements, PRESSION, Polices, Rayons, Typo } from "@/constants/theme";

/**
 * Une discussion à deux.
 *
 * Les messages arrivent en direct par le canal Supabase. On ajoute quand même
 * le message envoyé tout de suite dans la liste sans attendre le retour du
 * canal : sur un réseau lent, voir son propre message partir immédiatement
 * change tout. Le doublon éventuel est filtré par identifiant.
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
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityLabel="Retour"
          style={({ pressed }) => [s.retour, pressed && { opacity: PRESSION }]}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.neutre.encre} />
        </Pressable>
        <Avatar nom={titre} taille={38} ton="social" />
        <View style={s.flex}>
          <Text style={Typo.sousTitre} numberOfLines={1}>
            {titre}
          </Text>
          {!!sousTitre && (
            <Text style={Typo.petit} numberOfLines={1}>
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
          <View style={s.attente}>
            <Squelette cartes={2} />
          </View>
        ) : (
          <ScrollView
            ref={liste}
            contentContainerStyle={s.fil}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={s.premier}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.social.fonce}
                />
                <Text style={[Typo.corpsFort, s.premierTitre]}>Rien pour l&apos;instant</Text>
                <Text style={[Typo.petit, s.premierTexte]}>
                  Écris le premier message. Personne d&apos;autre que vous deux ne le lira.
                </Text>
              </View>
            )}

            {messages.map((m, i) => (
              <View key={m.id}>
                {changeDeJour(m, messages[i - 1]) && (
                  <View style={s.jour}>
                    <Text style={s.jourTexte}>{libelleJour(m.creeLe)}</Text>
                  </View>
                )}
                <Pressable
                  onLongPress={() => menu(m)}
                  style={({ pressed }) => [
                    s.bulle,
                    m.cestMoi ? s.bulleMoi : s.bulleAutre,
                    pressed && m.cestMoi && { opacity: PRESSION },
                  ]}
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

        {!!erreur && (
          <View style={s.erreur}>
            <Alerte type="erreur" texte={erreur} />
          </View>
        )}

        <View style={s.barre}>
          <Champ
            ton="social"
            conteneur={s.flex}
            value={brouillon}
            onChangeText={setBrouillon}
            placeholder="Écrire un message"
            multiline
            maxLength={2000}
            style={s.champ}
          />
          <Pressable
            onPress={envoyerMessage}
            disabled={!brouillon.trim() || envoiEnCours}
            accessibilityLabel="Envoyer"
            style={({ pressed }) => [
              s.envoi,
              (!brouillon.trim() || envoiEnCours) && s.envoiInactif,
              pressed && { opacity: PRESSION },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color={Colors.neutre.blanc} />
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
    gap: Espacements.sm + 2,
    paddingHorizontal: Espacements.gouttiere - 6,
    paddingVertical: Espacements.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutre.traitDoux,
    backgroundColor: Colors.neutre.surface,
  },
  retour: {
    width: 34,
    height: 34,
    borderRadius: Rayons.rond,
    alignItems: "center",
    justifyContent: "center",
  },
  attente: { padding: Espacements.gouttiere },
  fil: {
    paddingHorizontal: Espacements.gouttiere,
    paddingTop: Espacements.md,
    paddingBottom: Espacements.sm,
  },
  premier: {
    alignItems: "center",
    backgroundColor: Colors.social.clair,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
  },
  premierTitre: { marginTop: Espacements.sm },
  premierTexte: { marginTop: 4, textAlign: "center" },
  jour: { alignItems: "center", marginVertical: Espacements.md },
  jourTexte: {
    fontFamily: Polices.corpsFort,
    fontSize: 11.5,
    color: Colors.neutre.discret,
    backgroundColor: Colors.neutre.creux,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Rayons.rond,
    textTransform: "capitalize",
    overflow: "hidden",
  },
  bulle: {
    maxWidth: "84%",
    paddingHorizontal: Espacements.md - 2,
    paddingVertical: 10,
    borderRadius: Rayons.lg,
    marginTop: 5,
  },
  bulleMoi: {
    alignSelf: "flex-end",
    backgroundColor: Colors.social.base,
    borderBottomRightRadius: 5,
  },
  bulleAutre: {
    alignSelf: "flex-start",
    backgroundColor: Colors.neutre.surface,
    borderBottomLeftRadius: 5,
  },
  texte: {
    fontFamily: Polices.corps,
    fontSize: 15.5,
    lineHeight: 22,
    color: Colors.neutre.encre,
  },
  texteMoi: { color: Colors.neutre.blanc },
  heure: {
    fontFamily: Polices.corps,
    fontSize: 10.5,
    marginTop: 3,
    alignSelf: "flex-end",
    color: Colors.neutre.fantome,
  },
  heureMoi: { color: Colors.neutre.voileTexte },
  erreur: { paddingHorizontal: Espacements.gouttiere, paddingBottom: Espacements.sm },
  barre: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Espacements.sm,
    paddingHorizontal: Espacements.gouttiere,
    paddingTop: Espacements.sm + 2,
    paddingBottom: Espacements.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.traitDoux,
    backgroundColor: Colors.neutre.surface,
  },
  champ: { minHeight: 46, maxHeight: 120, paddingVertical: 12 },
  envoi: {
    width: 46,
    height: 46,
    borderRadius: Rayons.rond,
    backgroundColor: Colors.social.base,
    alignItems: "center",
    justifyContent: "center",
  },
  envoiInactif: { backgroundColor: Colors.neutre.trait },
});
