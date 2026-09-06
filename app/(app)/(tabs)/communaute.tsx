import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Bouton from "@/components/Bouton";
import Champ from "@/components/Champ";
import Puce from "@/components/Puce";
import Avatar from "@/components/Avatar";
import EtatVide from "@/components/EtatVide";
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
import { getMonProfil, messageErreur } from "@/lib/api";
import { Colors, Espacements, Polices, Rayons, Typo } from "@/constants/theme";

/**
 * Le fil de mon établissement.
 *
 * Aucun filtre n'est appliqué ici sur l'école : c'est la base qui ne renvoie
 * que les publications de mon établissement. Si un jour ce fil affiche une
 * publication d'une autre école, c'est une règle d'accès qui a sauté, pas un
 * bug d'affichage.
 */
export default function Communaute() {
  const router = useRouter();
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
    Alert.alert("Signaler cette publication", "Pourquoi ce contenu pose problème ?", [
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
    ]);
  }

  return (
    <Ecran
      ton="social"
      clavier
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
          surtitre="Communauté fermée"
          titre="Le fil"
          sousTitre={ecole ?? "Mon établissement"}
          action={
            <Pressable
              onPress={() => router.push("/membres" as Href)}
              hitSlop={8}
              accessibilityLabel="Annuaire des membres"
              style={s.boutonRond}
            >
              <Ionicons name="people-outline" size={19} color={Colors.social.fonce} />
            </Pressable>
          }
        />
      }
    >
      {/* Le composeur. Fermé, c'est une invite d'une ligne ; ouvert, il prend
          la place qu'il faut. Un champ de saisie toujours déplié mange l'écran
          sur un téléphone. */}
      {composerOuvert ? (
        <Carte>
          <View style={s.puces}>
            {CATEGORIES.map((c) => (
              <Puce
                key={c}
                libelle={c}
                ton="social"
                actif={categorie === c}
                onPress={() => setCategorie(c)}
                desactive={enCours}
              />
            ))}
          </View>
          <Champ
            ton="social"
            conteneur={s.champ}
            value={contenu}
            onChangeText={setContenu}
            placeholder="Poser une question, partager un bon plan..."
            multiline
            editable={!enCours}
            maxLength={2000}
          />
          <View style={s.actionsComposeur}>
            <Bouton
              titre="Annuler"
              variante="discret"
              taille="sm"
              onPress={() => {
                setComposerOuvert(false);
                setContenu("");
              }}
              desactive={enCours}
            />
            <Bouton
              titre="Publier"
              ton="social"
              taille="sm"
              icone="send"
              onPress={envoyer}
              enCours={enCours}
              desactive={contenu.trim().length < 3}
            />
          </View>
        </Carte>
      ) : (
        <Carte onPress={() => setComposerOuvert(true)}>
          <View style={s.invite}>
            <View style={s.inviteRond}>
              <Ionicons name="create-outline" size={18} color={Colors.social.fonce} />
            </View>
            <Text style={[Typo.corps, s.inviteTexte]}>Ce que tu veux dire à ta promo</Text>
          </View>
        </Carte>
      )}

      {publications.length === 0 ? (
        <EtatVide
          ton="social"
          icone="chatbubbles-outline"
          titre="Le fil est vide"
          texte="Personne n'a encore publié dans ton école. Lance la première discussion, c'est toujours quelqu'un qui commence."
          action={
            <Bouton
              titre="Écrire quelque chose"
              ton="social"
              onPress={() => setComposerOuvert(true)}
            />
          }
        />
      ) : (
        <View style={s.fil}>
          {publications.map((p) => (
            <Carte key={p.id} onPress={() => router.push(("/sujet/" + p.id) as Href)}>
              <View style={s.enteteSujet}>
                <Avatar nom={p.auteurNom} taille={38} />
                <View style={s.flex}>
                  <Text style={Typo.corpsFort} numberOfLines={1}>
                    {p.auteurNom || "Étudiant"}
                  </Text>
                  <Text style={Typo.petit}>{depuis(p.creeLe)}</Text>
                </View>
                {!!p.categorie && (
                  <View style={s.categorie}>
                    <Text style={s.categorieTexte}>{p.categorie}</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => menu(p)}
                  hitSlop={10}
                  accessibilityLabel="Options de la publication"
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color={Colors.neutre.fantome}
                  />
                </Pressable>
              </View>

              <Text style={[Typo.corps, s.corps]}>{p.contenu}</Text>

              <View style={s.pied}>
                <Pressable
                  onPress={() => aimer(p)}
                  hitSlop={8}
                  style={s.action}
                  accessibilityLabel={p.aimeParMoi ? "Retirer mon j'aime" : "J'aime"}
                >
                  <Ionicons
                    name={p.aimeParMoi ? "heart" : "heart-outline"}
                    size={18}
                    color={p.aimeParMoi ? Colors.etat.erreur : Colors.neutre.discret}
                  />
                  {p.jaime > 0 && (
                    <Text style={[s.compte, p.aimeParMoi && s.compteActif]}>{p.jaime}</Text>
                  )}
                </Pressable>
                <View style={s.action}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={17}
                    color={Colors.neutre.discret}
                  />
                  <Text style={s.compte}>
                    {p.commentaires > 0
                      ? p.commentaires + (p.commentaires > 1 ? " réponses" : " réponse")
                      : "Répondre"}
                  </Text>
                </View>
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
  boutonRond: {
    width: 38,
    height: 38,
    borderRadius: Rayons.rond,
    backgroundColor: Colors.social.clair,
    alignItems: "center",
    justifyContent: "center",
  },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Espacements.sm },
  champ: { marginTop: Espacements.md },
  actionsComposeur: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Espacements.sm,
    marginTop: Espacements.md,
  },
  invite: { flexDirection: "row", alignItems: "center", gap: Espacements.md - 2 },
  inviteRond: {
    width: 38,
    height: 38,
    borderRadius: Rayons.rond,
    backgroundColor: Colors.social.clair,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteTexte: { flex: 1, color: Colors.neutre.discret },
  fil: { gap: Espacements.sm + 4 },
  enteteSujet: { flexDirection: "row", alignItems: "center", gap: Espacements.sm + 2 },
  categorie: {
    backgroundColor: Colors.social.clair,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Rayons.rond,
  },
  categorieTexte: {
    fontFamily: Polices.corpsFort,
    fontSize: 11,
    color: Colors.social.fonce,
  },
  corps: { marginTop: Espacements.sm + 4, color: Colors.neutre.encre },
  pied: {
    flexDirection: "row",
    gap: Espacements.lg,
    marginTop: Espacements.md,
    paddingTop: Espacements.sm + 4,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.traitDoux,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  compte: { fontFamily: Polices.corpsFort, fontSize: 13, color: Colors.neutre.discret },
  compteActif: { color: Colors.etat.erreur },
});
