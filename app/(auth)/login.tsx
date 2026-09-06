import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { connexion, inscription, messageErreur } from "@/lib/api";
import { Colors, Espacements, Rayons } from "@/constants/theme";

/**
 * Connexion et inscription, sur un seul ecran.
 *
 * Deux modes qui basculent l'un dans l'autre : l'etudiant ne se demande pas
 * s'il doit chercher un bouton "creer un compte" ailleurs.
 *
 * Le rattachement a l'ecole se fait tout seul, en base, a partir du domaine
 * de l'adresse e-mail. D'ou le conseil affiche sous le champ.
 */
export default function Login() {
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
            "Compte cree. Ouvre le lien de confirmation envoye a " +
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
        >
          <View style={s.entete}>
            <View style={s.pastilles}>
              <View style={[s.pastille, { backgroundColor: Colors.prive.base }]} />
              <View style={[s.pastille, { backgroundColor: Colors.social.base }]} />
            </View>
            <Text style={s.titre}>CampusLife</Text>
            <Text style={s.accroche}>
              Ton agenda d&apos;etudes, et la communaute de ton ecole.
            </Text>
          </View>

          <View style={s.carte}>
            <Text style={s.label}>Adresse e-mail</Text>
            <TextInput
              style={s.champ}
              value={email}
              onChangeText={setEmail}
              placeholder="prenom.nom@etu.unistra.fr"
              placeholderTextColor={Colors.neutre.discret}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              editable={!enCours}
            />
            {estInscription && (
              <Text style={s.aide}>
                Utilise ton adresse universitaire : c&apos;est elle qui te
                rattache automatiquement a ton ecole.
              </Text>
            )}

            <Text style={[s.label, { marginTop: Espacements.md }]}>
              Mot de passe
            </Text>
            <TextInput
              style={s.champ}
              value={motDePasse}
              onChangeText={setMotDePasse}
              placeholder="6 caracteres minimum"
              placeholderTextColor={Colors.neutre.discret}
              secureTextEntry
              autoCapitalize="none"
              editable={!enCours}
            />

            {erreur && <Text style={s.erreur}>{erreur}</Text>}
            {info && <Text style={s.info}>{info}</Text>}

            <Pressable
              style={[s.bouton, !peutValider && s.boutonInactif]}
              onPress={valider}
              disabled={!peutValider}
            >
              {enCours ? (
                <ActivityIndicator color={Colors.neutre.blanc} />
              ) : (
                <Text style={s.boutonTexte}>
                  {estInscription ? "Creer mon compte" : "Me connecter"}
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
            style={s.bascule}
            onPress={() => {
              setMode(estInscription ? "connexion" : "inscription");
              setErreur(null);
              setInfo(null);
            }}
            disabled={enCours}
          >
            <Text style={s.basculeTexte}>
              {estInscription
                ? "J'ai deja un compte, me connecter"
                : "Pas encore de compte ? En creer un"}
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
    padding: Espacements.lg,
    paddingTop: Espacements.xl,
    flexGrow: 1,
    justifyContent: "center",
  },
  entete: { marginBottom: Espacements.xl },
  pastilles: { flexDirection: "row", gap: 6, marginBottom: Espacements.md },
  pastille: { width: 26, height: 8, borderRadius: 4 },
  titre: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: Colors.neutre.encre,
  },
  accroche: {
    fontSize: 16,
    color: Colors.neutre.texte,
    marginTop: Espacements.sm,
    lineHeight: 23,
  },
  carte: {
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.neutre.encre,
    marginBottom: Espacements.xs + 2,
  },
  champ: {
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    paddingHorizontal: Espacements.md,
    paddingVertical: 13,
    fontSize: 16,
    color: Colors.neutre.encre,
    backgroundColor: Colors.neutre.fond,
  },
  aide: {
    fontSize: 12.5,
    color: Colors.neutre.discret,
    marginTop: Espacements.xs + 2,
    lineHeight: 18,
  },
  erreur: {
    marginTop: Espacements.md,
    fontSize: 14,
    color: Colors.etat.erreur,
    lineHeight: 20,
  },
  info: {
    marginTop: Espacements.md,
    fontSize: 14,
    color: Colors.social.fonce,
    lineHeight: 20,
  },
  bouton: {
    marginTop: Espacements.lg,
    backgroundColor: Colors.prive.fonce,
    borderRadius: Rayons.md,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  boutonInactif: { opacity: 0.4 },
  boutonTexte: { color: Colors.neutre.blanc, fontSize: 16, fontWeight: "700" },
  bascule: { marginTop: Espacements.lg, alignItems: "center" },
  basculeTexte: {
    fontSize: 14.5,
    color: Colors.prive.fonce,
    fontWeight: "600",
  },
});
