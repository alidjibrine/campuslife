import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Bouton from "@/components/Bouton";
import Avatar from "@/components/Avatar";
import EtatVide from "@/components/EtatVide";
import { basculerAbonnement, listerMembres, type Membre } from "@/lib/communaute";
import { ouvrirConversation } from "@/lib/messages";
import { getMonProfil, messageErreur } from "@/lib/api";
import { Espacements, Typo } from "@/constants/theme";

/**
 * L'annuaire de mon établissement.
 *
 * La liste vient telle quelle de la base : les règles d'accès ne renvoient que
 * les profils rattachés à la même école que moi.
 */
export default function Membres() {
  const router = useRouter();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [ecole, setEcole] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [ouverture, setOuverture] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const [m, profil] = await Promise.all([listerMembres(), getMonProfil()]);
      setMembres(m);
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

  /** Ouvre la conversation avec ce membre, ou rejoint celle qui existe déjà. */
  async function discuter(m: Membre) {
    if (ouverture) return;
    setOuverture(m.id);
    try {
      const conversation = await ouvrirConversation(m.id);
      router.push(("/conversation/" + conversation) as Href);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setOuverture(null);
    }
  }

  async function suivre(m: Membre) {
    setMembres((liste) =>
      liste.map((x) => (x.id === m.id ? { ...x, suivi: !x.suivi } : x)),
    );
    try {
      await basculerAbonnement(m.id, m.suivi);
    } catch (e) {
      setErreur(messageErreur(e));
      await charger();
    }
  }

  const terme = recherche.trim().toLowerCase();
  const visibles = membres.filter((m) => {
    if (m.cestMoi) return false;
    if (!terme) return true;
    return [m.prenom, m.nom, m.filiere, m.anneeEtude]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(terme);
  });

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
          surtitre={ecole ?? "Mon établissement"}
          titre="Membres"
          sousTitre={
            visibles.length > 0
              ? visibles.length + (visibles.length > 1 ? " étudiants" : " étudiant")
              : undefined
          }
        />
      }
    >
      <Champ
        ton="social"
        value={recherche}
        onChangeText={setRecherche}
        placeholder="Chercher un nom, une filière"
        autoCapitalize="none"
      />

      {visibles.length === 0 ? (
        <EtatVide
          ton="social"
          icone={terme ? "search-outline" : "person-add-outline"}
          titre={terme ? "Personne ne correspond" : "Tu es seul pour l'instant"}
          texte={
            terme
              ? "Essaie un autre nom, une autre filière."
              : "Aucun autre étudiant de ton école n'a encore rejoint CampusLife. Le premier cercle, c'est toi qui l'amènes."
          }
        />
      ) : (
        <View style={s.liste}>
          {visibles.map((m) => {
            const nom = [m.prenom, m.nom].filter(Boolean).join(" ") || "Étudiant";
            return (
              <Carte key={m.id}>
                <View style={s.ligne}>
                  <Avatar nom={nom} url={m.avatarUrl} taille={44} />
                  <View style={s.flex}>
                    <Text style={Typo.corpsFort} numberOfLines={1}>
                      {nom}
                    </Text>
                    <Text style={Typo.petit} numberOfLines={1}>
                      {[m.anneeEtude, m.filiere].filter(Boolean).join(" · ") ||
                        "Profil incomplet"}
                    </Text>
                  </View>
                </View>
                <View style={s.actions}>
                  <Bouton
                    titre="Message"
                    ton="social"
                    taille="sm"
                    icone="chatbubble-outline"
                    onPress={() => discuter(m)}
                    enCours={ouverture === m.id}
                  />
                  <Bouton
                    titre={m.suivi ? "Suivi" : "Suivre"}
                    ton="social"
                    taille="sm"
                    variante={m.suivi ? "discret" : "contour"}
                    icone={m.suivi ? "checkmark" : "add"}
                    onPress={() => suivre(m)}
                  />
                </View>
              </Carte>
            );
          })}
        </View>
      )}
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  liste: { gap: Espacements.sm + 4 },
  ligne: { flexDirection: "row", alignItems: "center", gap: Espacements.md - 2 },
  actions: { flexDirection: "row", gap: Espacements.sm, marginTop: Espacements.md - 2 },
});
