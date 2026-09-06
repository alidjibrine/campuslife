import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import Bouton from "@/components/Bouton";
import EtatVide from "@/components/EtatVide";
import { listerConversations, type Conversation } from "@/lib/messages";
import { depuis } from "@/lib/communaute";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Typo } from "@/constants/theme";

/**
 * La liste des conversations privées.
 *
 * Elle se recharge à chaque retour sur l'onglet, ce qui suffit pour le
 * compteur. Le direct est réservé à l'écran de discussion, où il sert
 * vraiment, et à la pastille de l'onglet.
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

  return (
    <Ecran
      ton="social"
      chargement={chargement}
      erreur={erreur}
      rafraichit={rafraichit}
      surRafraichir={() => {
        setRafraichit(true);
        charger();
      }}
      entete={
        <Entete
          ton="social"
          surtitre="À deux, en privé"
          titre="Messages"
          sousTitre={
            total > 0
              ? total + (total > 1 ? " messages non lus" : " message non lu")
              : "Tes discussions privées"
          }
        />
      }
    >
      {conversations.length === 0 ? (
        <EtatVide
          ton="social"
          icone="chatbubble-ellipses-outline"
          titre="Aucune conversation"
          texte="Va dans l'annuaire de ton école et écris à quelqu'un. Une conversation s'ouvre au premier message, pas avant."
          action={
            <Bouton
              titre="Voir les membres"
              ton="social"
              icone="people-outline"
              onPress={() => router.push("/membres" as Href)}
            />
          }
        />
      ) : (
        <View style={s.liste}>
          {conversations.map((c) => (
            <Carte
              key={c.id}
              onPress={() => router.push(("/conversation/" + c.id) as Href)}
            >
              <View style={s.ligne}>
                <Avatar nom={c.autreNom} taille={46} />
                <View style={s.flex}>
                  <View style={s.haut}>
                    <Text style={[Typo.corpsFort, s.nom]} numberOfLines={1}>
                      {c.autreNom ?? "Étudiant"}
                    </Text>
                    <Text style={Typo.petit}>{depuis(c.dernierLe)}</Text>
                  </View>
                  <Text
                    style={[Typo.petit, s.apercu, c.nonLus > 0 && s.apercuNonLu]}
                    numberOfLines={1}
                  >
                    {c.dernierMessage ?? "Conversation ouverte, rien d'écrit"}
                  </Text>
                </View>
                {c.nonLus > 0 && (
                  <Badge ton="social" valeur={c.nonLus > 99 ? "99+" : c.nonLus} />
                )}
              </View>
            </Carte>
          ))}
        </View>
      )}
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  liste: { gap: Espacements.sm + 4 },
  ligne: { flexDirection: "row", alignItems: "center", gap: Espacements.md - 2 },
  haut: { flexDirection: "row", alignItems: "center", gap: Espacements.sm },
  nom: { flex: 1 },
  apercu: { marginTop: 3 },
  apercuNonLu: { color: Colors.neutre.encre },
});
