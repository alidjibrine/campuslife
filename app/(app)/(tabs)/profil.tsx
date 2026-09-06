import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { getMonProfil, messageErreur, type Profil as TypeProfil } from "@/lib/api";
import {
  formaterOctets,
  stockage,
  supprimerMonCompte,
  type Stockage,
} from "@/lib/compte";
import { LISTE_DOCUMENTS } from "@/constants/textes-legaux";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/** Mon profil : qui je suis, mon ecole, mes textes, et les deux sorties. */
export default function Profil() {
  const { deconnexion } = useAuth();
  const router = useRouter();
  const [profil, setProfil] = useState<TypeProfil | null>(null);
  const [espace, setEspace] = useState<Stockage | null>(null);
  const [chargement, setChargement] = useState(true);
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let monte = true;
      Promise.all([getMonProfil(), stockage().catch(() => null)])
        .then(([p, e]) => {
          if (!monte) return;
          setProfil(p);
          setEspace(e);
        })
        .catch(() => monte && setProfil(null))
        .finally(() => monte && setChargement(false));
      return () => {
        monte = false;
      };
    }, []),
  );

  function confirmerDeconnexion() {
    Alert.alert("Se deconnecter", "Tu devras retaper ton mot de passe.", [
      { text: "Annuler", style: "cancel" },
      { text: "Se deconnecter", style: "destructive", onPress: deconnexion },
    ]);
  }

  /**
   * Deux confirmations pour une action irreversible. La premiere explique ce
   * qui disparait, la seconde demande de le confirmer une bonne fois.
   */
  function confirmerSuppression() {
    Alert.alert(
      "Supprimer mon compte",
      "Tout disparait definitivement : tes cours, devoirs, notes, ton emploi du temps, tes publications, et tes conversations privees, y compris les messages de tes interlocuteurs. Il n'y a pas de retour en arriere.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          style: "destructive",
          onPress: () =>
            Alert.alert("Confirmer", "Derniere verification. On y va ?", [
              { text: "Non", style: "cancel" },
              { text: "Supprimer definitivement", style: "destructive", onPress: supprimer },
            ]),
        },
      ],
    );
  }

  async function supprimer() {
    setSuppression(true);
    setErreur(null);
    try {
      await supprimerMonCompte();
    } catch (e) {
      setErreur(messageErreur(e));
      setSuppression(false);
    }
  }

  if (chargement) {
    return (
      <View style={s.attente}>
        <ActivityIndicator size="large" color={Colors.prive.base} />
      </View>
    );
  }

  const initiales = ((profil?.prenom?.[0] ?? "") + (profil?.nom?.[0] ?? ""))
    .toUpperCase()
    .trim();

  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.contenu}>
        <View style={s.entete}>
          <View style={s.pastille}>
            <Text style={s.initiales}>{initiales || "?"}</Text>
          </View>
          <View style={s.flex}>
            <Text style={s.nom}>
              {profil?.prenom ?? ""} {profil?.nom ?? ""}
            </Text>
            <Text style={s.email}>{profil?.email ?? ""}</Text>
          </View>
        </View>

        <View style={s.bloc}>
          <View style={s.champ}>
            <Text style={s.champLabel}>Etablissement</Text>
            <Text style={s.champValeur}>
              {profil?.ecole?.nom ?? "Non rattache"}
            </Text>
          </View>
          <View style={s.champ}>
            <Text style={s.champLabel}>Annee</Text>
            <Text style={s.champValeur}>{profil?.anneeEtude ?? "Non renseignee"}</Text>
          </View>
          <View style={s.champ}>
            <Text style={s.champLabel}>Filiere</Text>
            <Text style={s.champValeur}>{profil?.filiere ?? "Non renseignee"}</Text>
          </View>
          <View style={[s.champ, s.dernier]}>
            <Text style={s.champLabel}>Stockage</Text>
            {espace ? (
              <>
                <Text style={s.champValeur}>
                  {formaterOctets(espace.utilise)} sur {formaterOctets(espace.quota)}
                </Text>
                <View style={s.jauge}>
                  <View
                  style={[s.jaugeRemplie, { width: `${espace.pourcentage}%` }]}
                />
                </View>
              </>
            ) : (
              <Text style={s.champValeur}>Indisponible</Text>
            )}
          </View>
        </View>

        <Pressable
          style={s.action}
          onPress={() => router.push("/(app)/onboarding")}
        >
          <Text style={s.actionTexte}>Modifier mes informations</Text>
        </Pressable>

        <Text style={s.rubrique}>Le cadre</Text>
        <View style={s.bloc}>
          {LISTE_DOCUMENTS.map((d, i) => (
            <Pressable
              key={d.cle}
              style={[s.champ, i === LISTE_DOCUMENTS.length - 1 && s.dernier]}
              onPress={() => router.push(("/document/" + d.cle) as Href)}
            >
              <Text style={s.lien}>{d.titre}</Text>
            </Pressable>
          ))}
        </View>

        {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

        <Pressable style={[s.action, s.sortie]} onPress={confirmerDeconnexion}>
          <Text style={[s.actionTexte, s.sortieTexte]}>Me deconnecter</Text>
        </Pressable>

        <Pressable
          style={[s.action, s.danger]}
          onPress={confirmerSuppression}
          disabled={suppression}
        >
          <Text style={[s.actionTexte, s.dangerTexte]}>
            {suppression ? "Suppression en cours..." : "Supprimer mon compte"}
          </Text>
        </Pressable>

        <Text style={s.version}>CampusLife, version de developpement</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  flex: { flex: 1 },
  attente: {
    flex: 1,
    backgroundColor: Colors.neutre.fond,
    justifyContent: "center",
    alignItems: "center",
  },
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl },
  entete: { flexDirection: "row", alignItems: "center", gap: Espacements.md },
  pastille: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.prive.fonce,
    alignItems: "center",
    justifyContent: "center",
  },
  initiales: { fontSize: 20, fontWeight: "800", color: Colors.neutre.blanc },
  nom: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: Colors.neutre.encre,
  },
  email: { fontSize: 13.5, color: Colors.neutre.discret, marginTop: 2 },
  bloc: {
    marginTop: Espacements.lg,
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.lg,
    paddingHorizontal: Espacements.lg,
  },
  champ: {
    paddingVertical: Espacements.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutre.trait,
  },
  dernier: { borderBottomWidth: 0 },
  champLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
  },
  champValeur: { fontSize: 15.5, color: Colors.neutre.encre, marginTop: 4 },
  jauge: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.neutre.trait,
    marginTop: 8,
    overflow: "hidden",
  },
  jaugeRemplie: { height: 5, backgroundColor: Colors.prive.base },
  rubrique: {
    marginTop: Espacements.xl,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: Colors.neutre.discret,
    textTransform: "uppercase",
  },
  lien: { fontSize: 15.5, color: Colors.prive.fonce, fontWeight: "600" },
  erreur: {
    marginTop: Espacements.md,
    fontSize: 14,
    color: Colors.etat.erreur,
  },
  action: {
    marginTop: Espacements.md,
    paddingVertical: 14,
    borderRadius: Rayons.md,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    backgroundColor: Colors.neutre.surface,
    alignItems: "center",
  },
  actionTexte: { fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  sortie: { borderColor: Colors.etat.erreur },
  sortieTexte: { color: Colors.etat.erreur },
  danger: { borderColor: Colors.etat.erreur, backgroundColor: Colors.etat.erreur },
  dangerTexte: { color: Colors.neutre.blanc },
  version: {
    marginTop: Espacements.xl,
    fontSize: 12,
    color: Colors.neutre.discret,
    textAlign: "center",
  },
});
