import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Bouton from "@/components/Bouton";
import Avatar from "@/components/Avatar";
import EtatVide from "@/components/EtatVide";
import Alerte from "@/components/Alerte";
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
import { Colors, Espacements, Polices, Rayons, Typo } from "@/constants/theme";

/** Une publication et ses réponses. */
export default function Sujet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [reponse, setReponse] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    try {
      const [liste, c] = await Promise.all([listerPublications(), listerCommentaires(id)]);
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
      Alert.alert("Ma réponse", undefined, [
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
    Alert.alert("Signaler cette réponse", "Pourquoi ce contenu pose problème ?", [
      { text: "Annuler", style: "cancel" },
      ...MOTIFS_SIGNALEMENT.map((m) => ({
        text: m.libelle,
        onPress: async () => {
          try {
            await signaler("comment", c.id, m.cle);
            Alert.alert("Merci", "Le signalement a bien été enregistré.");
          } catch (e) {
            Alert.alert("Signalement", messageErreur(e));
          }
        },
      })),
    ]);
  }

  return (
    <Ecran
      ton="social"
      clavier
      chargement={chargement}
      erreur={erreur}
      entete={<Entete retour ton="social" surtitre="Le fil" titre="Sujet" />}
      bas={
        publication ? (
          <View style={s.barre}>
            <Champ
              ton="social"
              conteneur={s.flex}
              value={reponse}
              onChangeText={setReponse}
              placeholder="Écrire une réponse"
              multiline
              maxLength={2000}
              style={s.champBas}
            />
            <Bouton
              titre="Envoyer"
              ton="social"
              taille="sm"
              onPress={envoyer}
              enCours={enCours}
              desactive={reponse.trim().length < 2}
            />
          </View>
        ) : undefined
      }
    >
      {!publication ? (
        <Alerte
          type="attention"
          texte="Cette publication n'existe plus, ou elle appartient à une autre école."
        />
      ) : (
        <>
          <Carte>
            <View style={s.entete}>
              <Avatar nom={publication.auteurNom} url={publication.auteurAvatar} taille={42} />
              <View style={s.flex}>
                <Text style={Typo.corpsFort} numberOfLines={1}>
                  {publication.auteurNom || "Étudiant"}
                </Text>
                <Text style={Typo.petit}>{depuis(publication.creeLe)}</Text>
              </View>
              {!!publication.categorie && (
                <View style={s.categorie}>
                  <Text style={s.categorieTexte}>{publication.categorie}</Text>
                </View>
              )}
            </View>
            <Text style={[Typo.corps, s.corps]}>{publication.contenu}</Text>
            <View style={s.stats}>
              <View style={s.stat}>
                <Ionicons
                  name={publication.aimeParMoi ? "heart" : "heart-outline"}
                  size={17}
                  color={
                    publication.aimeParMoi ? Colors.etat.erreur : Colors.neutre.discret
                  }
                />
                <Text style={s.statTexte}>{publication.jaime}</Text>
              </View>
              <View style={s.stat}>
                <Ionicons
                  name="chatbubble-outline"
                  size={16}
                  color={Colors.neutre.discret}
                />
                <Text style={s.statTexte}>{commentaires.length}</Text>
              </View>
            </View>
          </Carte>

          {commentaires.length === 0 ? (
            <EtatVide
              ton="social"
              icone="chatbubble-outline"
              titre="Aucune réponse"
              texte="Personne n'a encore répondu. Une réponse utile vaut mieux que dix j'aime."
            />
          ) : (
            <View style={s.reponses}>
              {commentaires.map((c) => (
                <Carte key={c.id} onLongPress={() => menuCommentaire(c)}>
                  <View style={s.entete}>
                    <Avatar nom={c.auteurNom} url={c.auteurAvatar} taille={34} />
                    <View style={s.flex}>
                      <Text style={[Typo.petitFort, s.nomReponse]} numberOfLines={1}>
                        {c.auteurNom || "Étudiant"}
                      </Text>
                      <Text style={Typo.petit}>{depuis(c.creeLe)}</Text>
                    </View>
                    <Pressable
                      onPress={() => menuCommentaire(c)}
                      hitSlop={10}
                      accessibilityLabel="Options de la réponse"
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={17}
                        color={Colors.neutre.fantome}
                      />
                    </Pressable>
                  </View>
                  <Text style={[Typo.corps, s.corpsReponse]}>{c.contenu}</Text>
                </Carte>
              ))}
            </View>
          )}
        </>
      )}
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  entete: { flexDirection: "row", alignItems: "center", gap: Espacements.sm + 2 },
  categorie: {
    backgroundColor: Colors.social.clair,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Rayons.rond,
  },
  categorieTexte: { fontFamily: Polices.corpsFort, fontSize: 11, color: Colors.social.fonce },
  corps: { marginTop: Espacements.md - 2, color: Colors.neutre.encre, fontSize: 16.5, lineHeight: 25 },
  stats: {
    flexDirection: "row",
    gap: Espacements.lg,
    marginTop: Espacements.md,
    paddingTop: Espacements.sm + 4,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.traitDoux,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statTexte: { fontFamily: Polices.corpsFort, fontSize: 13, color: Colors.neutre.discret },
  reponses: { gap: Espacements.sm + 4 },
  nomReponse: { color: Colors.neutre.encre },
  corpsReponse: { marginTop: Espacements.sm + 2, color: Colors.neutre.encre },
  barre: { flexDirection: "row", alignItems: "flex-end", gap: Espacements.sm },
  champBas: { minHeight: 44, maxHeight: 110, paddingVertical: 11 },
});
