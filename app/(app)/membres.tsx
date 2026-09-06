import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  basculerAbonnement,
  listerMembres,
  type Membre,
} from "@/lib/communaute";
import { ouvrirConversation } from "@/lib/messages";
import { getMonProfil, messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * L'annuaire de mon etablissement.
 *
 * La liste vient telle quelle de la base : les regles d'acces ne renvoient que
 * les profils rattaches a la meme ecole que moi.
 */
export default function Membres() {
  const router = useRouter();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [ecole, setEcole] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouverture, setOuverture] = useState<string | null>(null);

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
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  /** Ouvre la conversation avec ce membre, ou rejoint celle qui existe deja. */
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
    const texte = [m.prenom, m.nom, m.filiere, m.anneeEtude]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return texte.includes(terme);
  });

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={s.retour}>
          <Text style={s.retourTexte}>Retour</Text>
        </Pressable>

        <Text style={s.titre}>Membres</Text>
        <Text style={s.sousTitre}>{ecole ?? "Mon établissement"}</Text>

        <TextInput
          style={s.champ}
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Chercher un nom, une filière"
          placeholderTextColor={Colors.neutre.discret}
          autoCapitalize="none"
        />

        {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

        {chargement ? (
          <ActivityIndicator style={s.attente} size="large" color={Colors.social.base} />
        ) : visibles.length === 0 ? (
          <View style={s.vide}>
            <Text style={s.videTitre}>
              {terme ? "Personne ne correspond" : "Tu es seul pour l'instant"}
            </Text>
            <Text style={s.videTexte}>
              {terme
                ? "Essaie un autre nom."
                : "Aucun autre étudiant de ton école n'a encore rejoint CampusLife. Le premier cercle, c'est toi qui l'amènes."}
            </Text>
          </View>
        ) : (
          <View style={s.liste}>
            {visibles.map((m) => (
              <View key={m.id} style={s.carte}>
                <View style={s.avatar}>
                  <Text style={s.avatarTexte}>
                    {((m.prenom?.[0] ?? "") + (m.nom?.[0] ?? "")).toUpperCase() || "?"}
                  </Text>
                </View>
                <View style={s.flex}>
                  <Text style={s.nom}>
                    {[m.prenom, m.nom].filter(Boolean).join(" ") || "Étudiant"}
                  </Text>
                  <Text style={s.detail}>
                    {[m.anneeEtude, m.filiere].filter(Boolean).join(" · ") ||
                      "Profil incomplet"}
                  </Text>
                </View>
                <View style={s.actions}>
                  <Pressable
                    style={[s.bouton, s.boutonPlein]}
                    onPress={() => discuter(m)}
                    disabled={ouverture === m.id}
                  >
                    <Text style={[s.boutonTexte, s.boutonTexterPlein]}>
                      {ouverture === m.id ? "..." : "Message"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[s.bouton, m.suivi && s.boutonSuivi]}
                    onPress={() => suivre(m)}
                  >
                    <Text style={[s.boutonTexte, m.suivi && s.boutonTexteSuivi]}>
                      {m.suivi ? "Suivi" : "Suivre"}
                    </Text>
                  </Pressable>
                </View>
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
  flex: { flex: 1 },
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
  champ: {
    marginTop: Espacements.lg,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    paddingHorizontal: Espacements.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.neutre.encre,
    backgroundColor: Colors.neutre.surface,
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
  videTexte: { fontSize: 14, color: Colors.neutre.texte, marginTop: 4, lineHeight: 20 },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.social.clair,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexte: { fontSize: 14, fontWeight: "800", color: Colors.social.fonce },
  nom: { fontSize: 15, fontWeight: "700", color: Colors.neutre.encre },
  detail: { fontSize: 13, color: Colors.neutre.discret, marginTop: 2 },
  actions: { gap: 6, alignItems: "stretch" },
  bouton: {
    paddingHorizontal: Espacements.md,
    paddingVertical: 8,
    borderRadius: Rayons.sm,
    borderWidth: 1,
    borderColor: Colors.social.base,
  },
  boutonSuivi: { backgroundColor: Colors.social.clair },
  boutonPlein: { backgroundColor: Colors.social.base },
  boutonTexterPlein: { color: "#FFFFFF" },
  boutonTexte: { fontSize: 13, fontWeight: "700", color: Colors.social.fonce },
  boutonTexteSuivi: { color: Colors.social.fonce },
});
