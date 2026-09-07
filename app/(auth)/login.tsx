import { useState } from "react";
import { useRouter, type Href } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Champ from "@/components/Champ";
import Bouton from "@/components/Bouton";
import Alerte from "@/components/Alerte";
import Carte from "@/components/Carte";
import { connexion, inscription, messageErreur } from "@/lib/api";
import { Colors, Espacements, PRESSION, Rayons, Typo } from "@/constants/theme";

/**
 * Connexion et inscription, sur un seul écran.
 *
 * Deux modes qui basculent l'un dans l'autre : l'étudiant ne se demande pas
 * s'il doit chercher un bouton « créer un compte » ailleurs.
 *
 * Les deux traits de couleur en haut ne sont pas un ornement : ils annoncent
 * la règle du produit, le bleu pour ce qui m'appartient, le vert pour ce que
 * je partage. On les retrouve ensuite dans toute l'app.
 */
export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const estInscription = mode === "inscription";
  const peutValider = email.includes("@") && motDePasse.length >= 6 && !enCours;

  async function valider() {
    setErreur(null);
    setInfo(null);
    setEnCours(true);
    try {
      if (estInscription) {
        const { sessionCreee } = await inscription(email, motDePasse);
        if (!sessionCreee) {
          setInfo(
            "Compte créé. Ouvre le lien de confirmation envoyé à " +
              email.trim().toLowerCase() +
              ", puis reviens te connecter.",
          );
          setMode("connexion");
        }
        // Si une session est ouverte, le layout racine redirige tout seul.
      } else {
        await connexion(email, motDePasse);
      }
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.contenu}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.entete}>
            <View style={s.traits}>
              <View style={[s.trait, { backgroundColor: Colors.prive.base }]} />
              <View style={[s.trait, { backgroundColor: Colors.social.base }]} />
            </View>
            <Text style={s.marque}>CampusLife</Text>
            <Text style={[Typo.corps, s.accroche]}>
              Ton agenda d&apos;études, et la communauté de ton école.
            </Text>
          </View>

          <Carte style={s.carte}>
            <Champ
              label="Adresse e-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="prenom.nom@etu.unistra.fr"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              editable={!enCours}
              aide={
                estInscription
                  ? "Ton adresse universitaire, c'est elle qui te rattache à ton école."
                  : undefined
              }
            />

            <Champ
              conteneur={s.espace}
              label="Mot de passe"
              value={motDePasse}
              onChangeText={setMotDePasse}
              placeholder="6 caractères minimum"
              secureTextEntry
              autoCapitalize="none"
              editable={!enCours}
            />

            {!!erreur && (
              <View style={s.espace}>
                <Alerte type="erreur" texte={erreur} />
              </View>
            )}
            {!!info && (
              <View style={s.espace}>
                <Alerte type="succes" texte={info} />
              </View>
            )}

            <View style={s.espace}>
              <Bouton
                titre={estInscription ? "Créer mon compte" : "Me connecter"}
                pleineLargeur
                enCours={enCours}
                desactive={!peutValider}
                onPress={valider}
              />
            </View>
          </Carte>

          <Pressable
            style={({ pressed }) => [s.bascule, pressed && { opacity: PRESSION }]}
            onPress={() => {
              setMode(estInscription ? "connexion" : "inscription");
              setErreur(null);
              setInfo(null);
            }}
            disabled={enCours}
          >
            <Text style={[Typo.petitFort, s.basculeTexte]}>
              {estInscription
                ? "J'ai déjà un compte, me connecter"
                : "Pas encore de compte ? En créer un"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.aide, pressed && { opacity: PRESSION }]}
            onPress={() => router.push("/(auth)/mot-de-passe-oublie" as Href)}
            disabled={enCours}
          >
            <Text style={[Typo.petit, s.aideTexte]}>
              Mot de passe oublié, ou courriel de confirmation perdu ?
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.neutre.fond },
  flex: { flex: 1 },
  contenu: {
    padding: Espacements.gouttiere,
    paddingBottom: Espacements.xl,
    flexGrow: 1,
    justifyContent: "center",
  },
  entete: { marginBottom: Espacements.xl },
  traits: { flexDirection: "row", gap: 6, marginBottom: Espacements.md },
  trait: { width: 30, height: 7, borderRadius: Rayons.rond },
  marque: {
    fontFamily: Typo.grandTitre.fontFamily,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
    color: Colors.neutre.encre,
  },
  accroche: { marginTop: Espacements.sm, maxWidth: 320 },
  carte: { padding: Espacements.lg },
  espace: { marginTop: Espacements.md },
  bascule: { marginTop: Espacements.lg, alignItems: "center", paddingVertical: 6 },
  basculeTexte: { color: Colors.prive.fonce },
  aide: { marginTop: Espacements.sm, alignItems: "center", paddingVertical: 6 },
  aideTexte: { textAlign: "center" },
});
