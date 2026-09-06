import { useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import {
  getMonProfil,
  listerEcoles,
  majMonProfil,
  messageErreur,
  type Ecole,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Espacements, Rayons } from "@/constants/theme";

const ANNEES = ["L1", "L2", "L3", "M1", "M2", "Autre"];

/**
 * Onboarding du profil, obligatoire avant d'entrer dans l'app.
 *
 * L'ecole est normalement deja rattachee par le domaine de l'adresse e-mail.
 * Si la detection a echoue, l'etudiant la choisit dans la liste : mieux vaut
 * une roue de secours qu'un mur.
 *
 * A durcir avant l'ouverture au public (lot 7) : ce choix manuel permet de se
 * declarer dans n'importe quelle ecole. Tant qu'on est en test ferme, ca passe.
 */
export default function Onboarding() {
  const router = useRouter();
  const { deconnexion } = useAuth();

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [annee, setAnnee] = useState<string | null>(null);
  const [filiere, setFiliere] = useState("");
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [ecoleId, setEcoleId] = useState<string | null>(null);
  const [ecoleDetectee, setEcoleDetectee] = useState<Ecole | null>(null);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let monte = true;
    (async () => {
      try {
        const [profil, liste] = await Promise.all([getMonProfil(), listerEcoles()]);
        if (!monte) return;
        setEcoles(liste);
        if (profil) {
          setPrenom(profil.prenom ?? "");
          setNom(profil.nom ?? "");
          setAnnee(profil.anneeEtude);
          setFiliere(profil.filiere ?? "");
          setEcoleId(profil.ecoleId);
          setEcoleDetectee(profil.ecole);
        }
      } catch (e) {
        if (monte) setErreur(messageErreur(e));
      } finally {
        if (monte) setChargement(false);
      }
    })();
    return () => {
      monte = false;
    };
  }, []);

  const complet = prenom.trim() && nom.trim() && annee && ecoleId;

  async function enregistrer() {
    if (!complet || !annee) return;
    setErreur(null);
    setEnCours(true);
    try {
      await majMonProfil({
        prenom,
        nom,
        anneeEtude: annee,
        filiere: filiere || null,
        ecoleId,
      });
      router.replace("/qg");
    } catch (e) {
      setErreur(messageErreur(e));
      setEnCours(false);
    }
  }

  if (chargement) {
    return (
      <View style={s.attente}>
        <ActivityIndicator size="large" color={Colors.prive.base} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
          <Text style={s.surtitre}>PREMIERE ETAPE</Text>
          <Text style={s.titre}>Qui es-tu ?</Text>
          <Text style={s.accroche}>
            Trois informations, une fois pour toutes. Elles servent a t&apos;afficher
            dans la communaute de ton ecole.
          </Text>

          <View style={s.bloc}>
            <Text style={s.label}>Prenom</Text>
            <TextInput
              style={s.champ}
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Ali"
              placeholderTextColor={Colors.neutre.discret}
              editable={!enCours}
            />

            <Text style={[s.label, s.espace]}>Nom</Text>
            <TextInput
              style={s.champ}
              value={nom}
              onChangeText={setNom}
              placeholder="Djibrine"
              placeholderTextColor={Colors.neutre.discret}
              editable={!enCours}
            />

            <Text style={[s.label, s.espace]}>Annee d&apos;etude</Text>
            <View style={s.puces}>
              {ANNEES.map((a) => {
                const actif = annee === a;
                return (
                  <Pressable
                    key={a}
                    onPress={() => setAnnee(a)}
                    disabled={enCours}
                    style={[s.puce, actif && s.puceActive]}
                  >
                    <Text style={[s.puceTexte, actif && s.puceTexteActif]}>{a}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[s.label, s.espace]}>Filiere</Text>
            <TextInput
              style={s.champ}
              value={filiere}
              onChangeText={setFiliere}
              placeholder="Droit, informatique, gestion..."
              placeholderTextColor={Colors.neutre.discret}
              editable={!enCours}
            />
            <Text style={s.aide}>Facultatif.</Text>
          </View>

          <View style={s.bloc}>
            <Text style={s.label}>Mon ecole</Text>
            {ecoleDetectee ? (
              <View style={s.detectee}>
                <Text style={s.detecteeNom}>{ecoleDetectee.nom}</Text>
                <Text style={s.detecteeVille}>
                  {ecoleDetectee.ville} · reconnue a ton adresse e-mail
                </Text>
              </View>
            ) : (
              <>
                <Text style={s.aide}>
                  Ton adresse e-mail ne correspond a aucune ecole connue.
                  Choisis la tienne dans la liste.
                </Text>
                <View style={s.liste}>
                  {ecoles.map((e) => {
                    const actif = ecoleId === e.id;
                    return (
                      <Pressable
                        key={e.id}
                        onPress={() => setEcoleId(e.id)}
                        disabled={enCours}
                        style={[s.ligneEcole, actif && s.ligneEcoleActive]}
                      >
                        <View style={s.flex}>
                          <Text style={[s.ecoleNom, actif && s.ecoleNomActif]}>
                            {e.nom}
                          </Text>
                          <Text style={s.ecoleVille}>{e.ville}</Text>
                        </View>
                        {actif && <Text style={s.coche}>OK</Text>}
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={s.aide}>
                  Ton ecole n&apos;est pas dans la liste ? Elle n&apos;est pas
                  encore sur CampusLife. Ecris-moi, je l&apos;ajoute.
                </Text>
              </>
            )}
          </View>

          {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

          <Pressable
            style={[s.bouton, !complet && s.boutonInactif]}
            onPress={enregistrer}
            disabled={!complet || enCours}
          >
            {enCours ? (
              <ActivityIndicator color={Colors.neutre.blanc} />
            ) : (
              <Text style={s.boutonTexte}>C&apos;est parti</Text>
            )}
          </Pressable>

          <Pressable style={s.lien} onPress={deconnexion} disabled={enCours}>
            <Text style={s.lienTexte}>Me deconnecter</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  contenu: { padding: Espacements.lg, paddingBottom: Espacements.xl * 2 },
  surtitre: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "600",
    color: Colors.prive.fonce,
  },
  titre: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Colors.neutre.encre,
    marginTop: Espacements.xs,
  },
  accroche: {
    fontSize: 15,
    color: Colors.neutre.texte,
    marginTop: Espacements.sm,
    lineHeight: 22,
  },
  bloc: {
    backgroundColor: Colors.neutre.surface,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.lg,
    padding: Espacements.lg,
    marginTop: Espacements.lg,
  },
  label: { fontSize: 13, fontWeight: "700", color: Colors.neutre.encre, marginBottom: 6 },
  espace: { marginTop: Espacements.md },
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
    marginTop: 6,
    lineHeight: 18,
  },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Espacements.sm },
  puce: {
    paddingHorizontal: Espacements.md,
    paddingVertical: 9,
    borderRadius: Rayons.sm,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    backgroundColor: Colors.neutre.fond,
  },
  puceActive: {
    backgroundColor: Colors.prive.clair,
    borderColor: Colors.prive.base,
  },
  puceTexte: { fontSize: 14, fontWeight: "600", color: Colors.neutre.texte },
  puceTexteActif: { color: Colors.prive.fonce },
  detectee: {
    backgroundColor: Colors.prive.clair,
    borderRadius: Rayons.md,
    padding: Espacements.md,
  },
  detecteeNom: { fontSize: 16, fontWeight: "700", color: Colors.prive.fonce },
  detecteeVille: { fontSize: 13, color: Colors.neutre.texte, marginTop: 3 },
  liste: { marginTop: Espacements.sm, gap: Espacements.sm },
  ligneEcole: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.sm,
    borderWidth: 1,
    borderColor: Colors.neutre.trait,
    borderRadius: Rayons.md,
    padding: Espacements.md,
    backgroundColor: Colors.neutre.fond,
  },
  ligneEcoleActive: {
    borderColor: Colors.prive.base,
    backgroundColor: Colors.prive.clair,
  },
  ecoleNom: { fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  ecoleNomActif: { color: Colors.prive.fonce },
  ecoleVille: { fontSize: 13, color: Colors.neutre.discret, marginTop: 2 },
  coche: { fontSize: 12, fontWeight: "800", color: Colors.prive.fonce },
  erreur: {
    marginTop: Espacements.md,
    fontSize: 14,
    color: Colors.etat.erreur,
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
  lien: { marginTop: Espacements.md, alignItems: "center" },
  lienTexte: { fontSize: 14, color: Colors.neutre.discret, fontWeight: "600" },
});
