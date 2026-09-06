import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Puce from "@/components/Puce";
import Bouton from "@/components/Bouton";
import Badge from "@/components/Badge";
import EtatVide from "@/components/EtatVide";
import {
  libelleCible,
  listerSignalements,
  traiter,
  type Decision,
  type Signalement,
} from "@/lib/moderation";
import { depuis } from "@/lib/communaute";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons, Typo } from "@/constants/theme";

/**
 * Les signalements de mon établissement.
 *
 * Deux gestes seulement : retirer le contenu, ou classer sans suite. Pas de
 * demi-mesure, pas de file d'attente compliquée. Ce qui compte à ce stade,
 * c'est qu'un signalement reçoive une réponse le jour même.
 */
export default function Moderation() {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [enAttenteSeulement, setEnAttenteSeulement] = useState(true);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setSignalements(await listerSignalements());
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

  async function decider(sig: Signalement, decision: Decision, supprimer: boolean) {
    setEnCours(sig.id);
    try {
      await traiter(sig.id, decision, supprimer);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(null);
    }
  }

  function confirmerSuppression(sig: Signalement) {
    Alert.alert(
      "Retirer ce contenu",
      "Le contenu et ses réponses disparaissent définitivement. L'auteur n'est pas prévenu par l'application.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => decider(sig, "traite", true),
        },
      ],
    );
  }

  const visibles = enAttenteSeulement
    ? signalements.filter((x) => x.statut === "nouveau")
    : signalements;
  const enAttente = signalements.filter((x) => x.statut === "nouveau").length;

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
          retour
          ton="social"
          surtitre="Réservé aux modérateurs"
          titre="Modération"
          sousTitre={
            enAttente > 0
              ? enAttente +
                (enAttente > 1 ? " signalements en attente" : " signalement en attente")
              : "Rien en attente"
          }
        />
      }
    >
      <View style={s.filtres}>
        <Puce
          libelle="En attente"
          ton="social"
          actif={enAttenteSeulement}
          onPress={() => setEnAttenteSeulement(true)}
        />
        <Puce
          libelle="Tout"
          ton="social"
          actif={!enAttenteSeulement}
          onPress={() => setEnAttenteSeulement(false)}
        />
      </View>

      {visibles.length === 0 ? (
        <EtatVide
          ton="social"
          icone="shield-checkmark-outline"
          titre={enAttenteSeulement ? "Aucun signalement en attente" : "Aucun signalement"}
          texte="Le fil de ton établissement se tient. C'est bon signe."
        />
      ) : (
        <View style={s.liste}>
          {visibles.map((sig) => (
            <Carte key={sig.id}>
              <View style={s.haut}>
                <Badge ton="erreur" variante="doux" valeur={sig.motifLibelle} />
                <View style={s.flex} />
                <Text style={Typo.petit}>{depuis(sig.creeLe)}</Text>
              </View>

              <Text style={[Typo.petit, s.meta]}>
                {libelleCible(sig.cibleType)}
                {sig.auteurNom ? " de " + sig.auteurNom : ""}
                {sig.statut !== "nouveau"
                  ? " · " + (sig.statut === "traite" ? "retiré" : "classé sans suite")
                  : ""}
              </Text>

              {!!sig.detail && (
                <Text style={[Typo.petit, s.detail]}>« {sig.detail} »</Text>
              )}

              <View style={s.extrait}>
                <Text style={[Typo.corps, s.extraitTexte]}>
                  {sig.existe ? sig.contenu || "Contenu vide" : "Ce contenu n'existe plus."}
                </Text>
              </View>

              {sig.statut === "nouveau" && (
                <View style={s.actions}>
                  {sig.existe && sig.cibleType !== "profile" && (
                    <Bouton
                      titre="Retirer le contenu"
                      variante="danger"
                      taille="sm"
                      icone="trash-outline"
                      onPress={() => confirmerSuppression(sig)}
                      desactive={enCours === sig.id}
                    />
                  )}
                  <Bouton
                    titre="Classer sans suite"
                    variante="discret"
                    taille="sm"
                    onPress={() => decider(sig, "rejete", false)}
                    enCours={enCours === sig.id}
                  />
                </View>
              )}
            </Carte>
          ))}
        </View>
      )}
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  filtres: { flexDirection: "row", gap: Espacements.sm },
  liste: { gap: Espacements.sm + 4 },
  haut: { flexDirection: "row", alignItems: "center", gap: Espacements.sm },
  meta: { marginTop: Espacements.sm },
  detail: { marginTop: 6, fontStyle: "italic", color: Colors.neutre.texte },
  extrait: {
    marginTop: Espacements.sm + 4,
    padding: Espacements.md - 2,
    borderRadius: Rayons.md,
    backgroundColor: Colors.neutre.creux,
  },
  extraitTexte: { color: Colors.neutre.encre },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Espacements.sm, marginTop: Espacements.md },
});
