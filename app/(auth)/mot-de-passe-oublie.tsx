import { useState } from "react";
import { useRouter } from "expo-router";
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
import { Ionicons } from "@expo/vector-icons";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Bouton from "@/components/Bouton";
import Alerte from "@/components/Alerte";
import {
  demanderReinitialisation,
  messageErreur,
  renvoyerConfirmation,
} from "@/lib/api";
import { Colors, Espacements, PRESSION, Rayons, Typo } from "@/constants/theme";

/**
 * Mot de passe oublié, et renvoi du courriel de confirmation.
 *
 * Les deux sont sur le même écran parce qu'ils répondent à la même détresse :
 * je n'arrive pas à entrer et je ne sais pas pourquoi.
 *
 * On ne dit jamais si l'adresse existe. Répondre « ce compte n'existe pas »
 * permettrait à n'importe qui de savoir qui est inscrit à quelle école.
 */
export default function MotDePasseOublie() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [enCours, setEnCours] = useState<"reinitialiser" | "confirmer" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState<string | null>(null);

  const valide = email.includes("@") && email.trim().length > 4;

  async function reinitialiser() {
    if (!valide || enCours) return;
    setEnCours("reinitialiser");
    setErreur(null);
    setEnvoye(null);
    try {
      await demanderReinitialisation(email);
      setEnvoye(
        "Si un compte existe avec cette adresse, un courriel vient d'y être envoyé. Ouvre le lien depuis ton téléphone, l'app s'ouvrira sur le choix du nouveau mot de passe.",
      );
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(null);
    }
  }

  async function confirmer() {
    if (!valide || enCours) return;
    setEnCours("confirmer");
    setErreur(null);
    setEnvoye(null);
    try {
      await renvoyerConfirmation(email);
      setEnvoye(
        "Si un compte en attente de confirmation existe avec cette adresse, le courriel vient d'être renvoyé.",
      );
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(null);
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
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Retour"
            hitSlop={8}
            style={({ pressed }) => [s.retour, pressed && { opacity: PRESSION }]}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.neutre.encre} />
          </Pressable>

          <Text style={[Typo.etiquette, s.surtitre]}>Je n&apos;arrive pas à entrer</Text>
          <Text style={Typo.grandTitre}>Mot de passe oublié</Text>
          <Text style={[Typo.corps, s.accroche]}>
            Indique ton adresse universitaire. Tu recevras un lien qui rouvre
            l&apos;app directement sur le choix d&apos;un nouveau mot de passe.
          </Text>

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
            />

            {!!erreur && (
              <View style={s.espace}>
                <Alerte type="erreur" texte={erreur} />
              </View>
            )}
            {!!envoye && (
              <View style={s.espace}>
                <Alerte type="succes" titre="Courriel envoyé" texte={envoye} />
              </View>
            )}

            <View style={s.espace}>
              <Bouton
                titre="Recevoir le lien"
                icone="mail-outline"
                pleineLargeur
                onPress={reinitialiser}
                enCours={enCours === "reinitialiser"}
                desactive={!valide || enCours !== null}
              />
            </View>
          </Carte>

          <View style={s.autre}>
            <Text style={[Typo.petitFort, s.autreTitre]}>
              Mon compte n&apos;est jamais devenu actif
            </Text>
            <Text style={[Typo.petit, s.autreTexte]}>
              Si tu n&apos;as jamais reçu le courriel de confirmation à
              l&apos;inscription, ou que tu l&apos;as perdu, on peut te le renvoyer.
            </Text>
            <View style={s.espace}>
              <Bouton
                titre="Renvoyer la confirmation"
                variante="contour"
                taille="sm"
                onPress={confirmer}
                enCours={enCours === "confirmer"}
                desactive={!valide || enCours !== null}
              />
            </View>
          </View>
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
    paddingTop: Espacements.md,
    paddingBottom: Espacements.xl,
  },
  retour: {
    width: 38,
    height: 38,
    borderRadius: Rayons.rond,
    backgroundColor: Colors.neutre.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Espacements.lg,
  },
  surtitre: { color: Colors.prive.base, marginBottom: 5 },
  accroche: { marginTop: 6 },
  carte: { padding: Espacements.lg, marginTop: Espacements.lg },
  espace: { marginTop: Espacements.md },
  autre: {
    marginTop: Espacements.xl,
    paddingTop: Espacements.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.trait,
  },
  autreTitre: { color: Colors.neutre.encre },
  autreTexte: { marginTop: 4 },
});
