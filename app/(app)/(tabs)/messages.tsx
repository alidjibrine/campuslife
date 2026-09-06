import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listerConversations, type Conversation } from "@/lib/messages";
import { depuis } from "@/lib/communaute";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * La liste des conversations privees.
 *
 * Elle se recharge a chaque fois qu'on revient sur l'onglet, ce qui suffit
 * pour le compteur de non lus. Le direct est reserve a l'ecran de discussion,
 * ou il sert vraiment.
 */
export default function Messages() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setConversations(await listerConversations());
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

  const total = conversations.reduce((somme, c) => somme + c.nonLus, 0);

  function initiales(nom: string | null): string {
    if (!nom) return "?";
    return nom
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot[0])
      .join("")
      .toUpperCase();
  }

  return (
    <SafeAreaView style={s.page}>
      <ScrollView
        contentContainerStyle={s.contenu}
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
        <Text style={s.titre}>Messages</Text>
        <Text style={s.sousTitre}>
          {total > 0
            ? total + (total > 1 ? " messages non lus" : " message non lu")
            : "Tes discussions privees"}
        </Text>

        {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

        {chargement ? (
          <ActivityIndicator style={s.attente} size="large" color={Colors.social.base} />
        ) : conversations.length === 0 ? (
          <View style={s.vide}>
            <Text style={s.videTitre}>Aucune conversation</Text>
            <Text style={s.videTexte}>
              Va dans l'annuaire de ton ecole et ecris a quelqu'un. Une conversation
              s'ouvre au premier message, pas avant.
            </Text>
            <Pressable
              style={s.videBouton}
              onPress={() => router.push("/membres" as Href)}
            >
              <Text style={s.videBoutonTexte}>Voir les membres</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.liste}>
            {conversations.map((c) => (
              <Pressable
                key={c.id}
                style={s.carte}
                onPress={() => router.push(("/conversation/" + c.id) as Href)}
              >
                <View style={s.avatar}>
                  <Text style={s.avatarTexte}>{initiales(c.autreNom)}</Text>
                </View>
                <View style={s.flex}>
                  <View style={s.ligneHaut}>
                    <Text style={s.nom} numberOfLines={1}>
                      {c.autreNom ?? "Etudiant"}
                    </Text>
                    <Text style={s.quand}>{depuis(c.dernierLe)}</Text>
                  </View>
                  <Text
                    style={[s.apercu, c.nonLus > 0 && s.apercuNonLu]}
                    numberOfLines={1}
                  >
                    {c.dernierMessage ?? "Conversation ouverte, rien d'ecrit"}
                  </Text>
                </View>
                {c.nonLus > 0 && (
                  <View style={s.pastille}>
                    <Text style={s.pastilleTexte}>{c.nonLus > 99 ? "99+" : c.nonLus}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  flex: { flex: 1 },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl },
  titre: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.neutre.encre,
  },
  sousTitre: {
    fontSize: 13.5,
    color: Colors.social.fonce,
    marginTop: 2,
    fontWeight: "600",
  },
  erreur: { marginTop: Espacements.md, fontSize: 14, color: Colors.etat.erreur },
  attente: { marginTop: Espacements.xl },
  vide: {
    marginTop: Espacements.lg,
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
  videBouton: {
    marginTop: Espacements.md,
    alignSelf: "flex-start",
    paddingHorizontal: Espacements.md,
    paddingVertical: 10,
    borderRadius: Rayons.sm,
    backgroundColor: Colors.social.base,
  },
  videBoutonTexte: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.social.clair,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexte: { fontSize: 15, fontWeight: "800", color: Colors.social.fonce },
  ligneHaut: { flexDirection: "row", alignItems: "center", gap: Espacements.sm },
  nom: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.neutre.encre },
  quand: { fontSize: 12, color: Colors.neutre.discret },
  apercu: { fontSize: 13.5, color: Colors.neutre.discret, marginTop: 3 },
  apercuNonLu: { color: Colors.neutre.encre, fontWeight: "600" },
  pastille: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: Colors.social.base,
    alignItems: "center",
    justifyContent: "center",
  },
  pastilleTexte: { fontSize: 11.5, fontWeight: "800", color: "#FFFFFF" },
});
