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
  rattacherMonEcole,
  type Ecole,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Espacements, Rayons } from "@/constants/theme";

const ANNEES = ["L1", "L2", "L3", "M1", "M2", "Autre"];

/**
 * Onboarding du profil, obligatoire avant d'entrer dans l'app.
 *
 * L'ecole ne se choisit pas. Elle decoule du domaine de l'adresse
 * universitaire, et la base refuse toute autre valeur (migration 011). Il y
 * avait ici, jusqu'au 6 septembre 2026, une liste deroulante permettant de se
 * declarer dans l'etablissement de son choix : c'etait la faille qui annulait
 * toute la regle de communaute fermee.
 *
 * Si le domaine n'est reconnu par aucun etablissement, l'etudiant ne peut pas
 * entrer. C'est le prix d'une communaute fermee, et c'est assume. Le bouton de
 * verification sert au cas ou l'ecole aurait ete ajoutee depuis l'inscription.
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
  const [verification, setVerification] = useState(false);
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

  /** Redemande le rattachement, au cas ou l'ecole aurait ete ajoutee depuis. */
  async function verifierEcole() {
    setErreur(null);
    setVerification(true);
    try {
      const ecole = await rattacherMonEcole();
      if (ecole) {
        setEcoleDetectee(ecole);
        setEcoleId(ecole.id);
      } else {
        setErreur(
          "Ton adresse n'est toujours reconnue par aucun établissement.",
        );
      }
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setVerification(false);
    }
  }

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
          <Text style={s.surtitre}>PREMIÈRE ÉTAPE</Text>
          <Text style={s.titre}>Qui es-tu ?</Text>
          <Text style={s.accroche}>
            Trois informations, une fois pour toutes. Elles servent à t&apos;afficher
            dans la communauté de ton école.
          </Text>

          <View style={s.bloc}>
            <Text style={s.label}>Prénom</Text>
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

            <Text style={[s.label, s.espace]}>Année d&apos;étude</Text>
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

            <Text style={[s.label, s.espace]}>Filière</Text>
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
            <Text style={s.label}>Mon école</Text>
            {ecoleDetectee ? (
              <View style={s.detectee}>
                <Text style={s.detecteeNom}>{ecoleDetectee.nom}</Text>
                <Text style={s.detecteeVille}>
                  {ecoleDetectee.ville} · reconnue à ton adresse e-mail
                </Text>
              </View>
            ) : (
              <>
                <Text style={s.aide}>
                  Ton adresse e-mail n&apos;est reconnue par aucun
                  établissement. CampusLife est une communauté fermée : le
                  rattachement se fait uniquement par l&apos;adresse
                  universitaire, il ne se choisit pas.
                </Text>

                <Pressable
                  style={s.verifier}
                  onPress={verifierEcole}
                  disabled={verification || enCours}
                >
                  <Text style={s.verifierTexte}>
                    {verification ? "Vérification..." : "Vérifier à nouveau"}
                  </Text>
                </Pressable>

                <Text style={[s.aide, s.espace]}>
                  Établissements couverts aujourd&apos;hui :
                </Text>
                <View style={s.liste}>
                  {ecoles.map((e) => (
                    <View key={e.id} style={s.ligneEcole}>
                      <View style={s.flex}>
                        <Text style={s.ecoleNom}>{e.nom}</Text>
                        <Text style={s.ecoleVille}>{e.ville}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <Text style={s.aide}>
                  La tienne n&apos;y est pas ? Écris-moi avec ton adresse
                  universitaire, je l&apos;ajoute, et tu reviens appuyer sur
                  Vérifier à nouveau.
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
            <Text style={s.lienTexte}>Me déconnecter</Text>
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
  verifier: {
    marginTop: Espacements.md,
    alignSelf: "flex-start",
    paddingHorizontal: Espacements.md,
    paddingVertical: 10,
    borderRadius: Rayons.sm,
    borderWidth: 1,
    borderColor: Colors.prive.base,
    backgroundColor: Colors.prive.clair,
  },
  verifierTexte: { fontSize: 14, fontWeight: "700", color: Colors.prive.fonce },
  ecoleNom: { fontSize: 15, fontWeight: "600", color: Colors.neutre.encre },
  ecoleVille: { fontSize: 13, color: Colors.neutre.discret, marginTop: 2 },
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
