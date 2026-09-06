import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  libelleCible,
  listerSignalements,
  traiter,
  type Decision,
  type Signalement,
} from "@/lib/moderation";
import { depuis } from "@/lib/communaute";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Les signalements de mon etablissement.
 *
 * Deux gestes seulement : retirer le contenu, ou classer sans suite. Pas de
 * demi-mesure, pas de file d'attente compliquee. Ce qui compte a ce stade,
 * c'est qu'un signalement recoive une reponse le jour meme.
 */
export default function Moderation() {
  const router = useRouter();
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

  async function decider(s: Signalement, decision: Decision, supprimer: boolean) {
    setEnCours(s.id);
    try {
      await traiter(s.id, decision, supprimer);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(null);
    }
  }

  function confirmerSuppression(s: Signalement) {
    Alert.alert(
      "Retirer ce contenu",
      "Le contenu et ses réponses disparaissent définitivement. L'auteur n'est pas prévenu par l'application.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => decider(s, "traite", true),
        },
      ],
    );
  }

  const visibles = enAttenteSeulement
    ? signalements.filter((s) => s.statut === "nouveau")
    : signalements;
  const enAttente = signalements.filter((s) => s.statut === "nouveau").length;

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
        <Pressable onPress={() => router.back()} style={s.retour} hitSlop={10}>
          <Text style={s.retourTexte}>Retour</Text>
        </Pressable>

        <Text style={s.titre}>Modération</Text>
        <Text style={s.sousTitre}>
          {enAttente > 0
            ? enAttente + (enAttente > 1 ? " signalements en attente" : " signalement en attente")
            : "Rien en attente"}
        </Text>

        <View style={s.filtres}>
          {[
            { cle: true, libelle: "En attente" },
            { cle: false, libelle: "Tout" },
          ].map((f) => (
            <Pressable
              key={String(f.cle)}
              style={[s.filtre, enAttenteSeulement === f.cle && s.filtreActif]}
              onPress={() => setEnAttenteSeulement(f.cle)}
            >
              <Text
                style={[
                  s.filtreTexte,
                  enAttenteSeulement === f.cle && s.filtreTexteActif,
                ]}
              >
                {f.libelle}
              </Text>
            </Pressable>
          ))}
        </View>

        {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

        {chargement ? (
          <ActivityIndicator style={s.attente} size="large" color={Colors.social.base} />
        ) : visibles.length === 0 ? (
          <View style={s.vide}>
            <Text style={s.videTitre}>
              {enAttenteSeulement ? "Aucun signalement en attente" : "Aucun signalement"}
            </Text>
            <Text style={s.videTexte}>
              Le fil de ton établissement se tient. C&apos;est bon signe.
            </Text>
          </View>
        ) : (
          <View style={s.liste}>
            {visibles.map((sig) => (
              <View key={sig.id} style={s.carte}>
                <View style={s.ligneHaut}>
                  <Text style={s.motif}>{sig.motifLibelle}</Text>
                  <Text style={s.quand}>{depuis(sig.creeLe)}</Text>
                </View>

                <Text style={s.meta}>
                  {libelleCible(sig.cibleType)}
                  {sig.auteurNom ? " de " + sig.auteurNom : ""}
                  {sig.statut !== "nouveau"
                    ? " · " + (sig.statut === "traite" ? "retiré" : "classé sans suite")
                    : ""}
                </Text>

                {!!sig.detail && <Text style={s.detail}>« {sig.detail} »</Text>}

                <View style={s.extrait}>
                  <Text style={s.extraitTexte}>
                    {sig.existe
                      ? sig.contenu || "Contenu vide"
                      : "Ce contenu n'existe plus."}
                  </Text>
                </View>

                {sig.statut === "nouveau" && (
                  <View style={s.actions}>
                    {sig.existe && sig.cibleType !== "profile" && (
                      <Pressable
                        style={[s.bouton, s.boutonDanger]}
                        onPress={() => confirmerSuppression(sig)}
                        disabled={enCours === sig.id}
                      >
                        <Text style={[s.boutonTexte, s.boutonTexteDanger]}>
                          Retirer le contenu
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={s.bouton}
                      onPress={() => decider(sig, "rejete", false)}
                      disabled={enCours === sig.id}
                    >
                      <Text style={s.boutonTexte}>
                        {enCours === sig.id ? "..." : "Classer sans suite"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl },
  retour: { marginBottom: Espacements.md },
  retourTexte: { fontSize: 14, fontWeight: "600", color: Colors.social.fonce },
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
  filtres: { flexDirection: "row", gap: Espacements.sm, marginTop: Espacements.lg },
  filtre: {
    paddingHorizontal: Espacements.md,
    paddingVertical: 8,
    borderRadius: Rayons.sm,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    backgroundColor: Colors.neutre.surface,
  },
  filtreActif: { backgroundColor: Colors.social.clair, borderColor: Colors.social.base },
  filtreTexte: { fontSize: 13, fontWeight: "600", color: Colors.neutre.discret },
  filtreTexteActif: { color: Colors.social.fonce },
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
  liste: { marginTop: Espacements.lg, gap: Espacements.md },
  carte: {
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    padding: Espacements.md,
  },
  ligneHaut: { flexDirection: "row", alignItems: "center", gap: Espacements.sm },
  motif: { flex: 1, fontSize: 15, fontWeight: "800", color: Colors.etat.erreur },
  quand: { fontSize: 12, color: Colors.neutre.discret },
  meta: { fontSize: 13, color: Colors.neutre.discret, marginTop: 4 },
  detail: {
    fontSize: 13.5,
    color: Colors.neutre.texte,
    marginTop: 8,
    fontStyle: "italic",
  },
  extrait: {
    marginTop: Espacements.sm,
    padding: Espacements.md,
    borderRadius: Rayons.sm,
    backgroundColor: Colors.neutre.fond,
  },
  extraitTexte: { fontSize: 14.5, lineHeight: 21, color: Colors.neutre.encre },
  actions: { flexDirection: "row", gap: Espacements.sm, marginTop: Espacements.md },
  bouton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Rayons.sm,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    alignItems: "center",
  },
  boutonDanger: { borderColor: Colors.etat.erreur, backgroundColor: Colors.etat.erreur },
  boutonTexte: { fontSize: 13.5, fontWeight: "700", color: Colors.neutre.encre },
  boutonTexteDanger: { color: Colors.neutre.blanc },
});
