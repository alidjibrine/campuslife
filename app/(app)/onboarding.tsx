import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Puce from "@/components/Puce";
import Bouton from "@/components/Bouton";
import Alerte from "@/components/Alerte";
import Section from "@/components/Section";
import {
  getMonProfil,
  listerEcoles,
  majMonProfil,
  messageErreur,
  rattacherMonEcole,
  type Ecole,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Espacements, PRESSION, Rayons, Typo } from "@/constants/theme";

const ANNEES = ["L1", "L2", "L3", "M1", "M2", "Autre"];

/**
 * Onboarding du profil, obligatoire avant d'entrer dans l'app.
 *
 * L'école ne se choisit pas. Elle découle du domaine de l'adresse
 * universitaire, et la base refuse toute autre valeur (migration 011). Il y
 * avait ici, jusqu'au 6 septembre 2026, une liste déroulante permettant de se
 * déclarer dans l'établissement de son choix : c'était la faille qui annulait
 * toute la règle de communauté fermée.
 *
 * Si le domaine n'est reconnu par aucun établissement, l'étudiant ne peut pas
 * entrer. C'est le prix d'une communauté fermée, et c'est assumé. Le bouton de
 * vérification sert au cas où l'école aurait été ajoutée depuis l'inscription.
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

  /** Redemande le rattachement, au cas où l'école aurait été ajoutée depuis. */
  async function verifierEcole() {
    setErreur(null);
    setVerification(true);
    try {
      const ecole = await rattacherMonEcole();
      if (ecole) {
        setEcoleDetectee(ecole);
        setEcoleId(ecole.id);
      } else {
        setErreur("Ton adresse n'est toujours reconnue par aucun établissement.");
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

  return (
    <Ecran
      clavier
      chargement={chargement}
      erreur={erreur}
      entete={
        <Entete
          surtitre="Première étape"
          titre="Qui es-tu ?"
          sousTitre="Trois informations, une fois pour toutes. Elles servent à t'afficher dans la communauté de ton école."
        />
      }
    >
      <Carte style={s.bloc}>
        <Champ
          label="Prénom"
          value={prenom}
          onChangeText={setPrenom}
          placeholder="Ali"
          editable={!enCours}
        />
        <Champ
          conteneur={s.espace}
          label="Nom"
          value={nom}
          onChangeText={setNom}
          placeholder="Djibrine"
          editable={!enCours}
        />

        <View style={s.espace}>
          <Text style={[Typo.petitFort, s.label]}>Année d&apos;étude</Text>
          <View style={s.puces}>
            {ANNEES.map((a) => (
              <Puce
                key={a}
                libelle={a}
                actif={annee === a}
                onPress={() => setAnnee(a)}
                desactive={enCours}
              />
            ))}
          </View>
        </View>

        <Champ
          conteneur={s.espace}
          label="Filière"
          value={filiere}
          onChangeText={setFiliere}
          placeholder="Droit, informatique, gestion..."
          editable={!enCours}
          aide="Facultatif."
        />
      </Carte>

      <Section titre="Mon école">
        {ecoleDetectee ? (
          <Carte style={s.detectee}>
            <View style={s.detecteeRangee}>
              <View style={s.detecteeRond}>
                <Ionicons name="school" size={20} color={Colors.prive.fonce} />
              </View>
              <View style={s.flex}>
                <Text style={[Typo.corpsFort, s.detecteeNom]}>{ecoleDetectee.nom}</Text>
                <Text style={[Typo.petit, s.detecteeVille]}>
                  {ecoleDetectee.ville} · reconnue à ton adresse e-mail
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={Colors.etat.succes} />
            </View>
          </Carte>
        ) : (
          <>
            <Alerte
              type="attention"
              titre="Aucun établissement reconnu"
              texte="CampusLife est une communauté fermée : le rattachement se fait uniquement par l'adresse universitaire, il ne se choisit pas."
            />
            <Bouton
              titre="Vérifier à nouveau"
              variante="contour"
              icone="refresh-outline"
              onPress={verifierEcole}
              enCours={verification}
              desactive={enCours}
            />
            <Carte variante="creux">
              <Text style={Typo.etiquette}>Établissements couverts aujourd&apos;hui</Text>
              <View style={s.listeEcoles}>
                {ecoles.map((e) => (
                  <View key={e.id} style={s.ligneEcole}>
                    <Ionicons name="ellipse" size={6} color={Colors.neutre.fantome} />
                    <Text style={Typo.corps}>
                      {e.nom} <Text style={s.ville}>· {e.ville}</Text>
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={[Typo.petit, s.aide]}>
                La tienne n&apos;y est pas ? Écris-moi avec ton adresse universitaire, je
                l&apos;ajoute, et tu reviens appuyer sur Vérifier à nouveau.
              </Text>
            </Carte>
          </>
        )}
      </Section>

      <Bouton
        titre="C'est parti"
        icone="arrow-forward"
        pleineLargeur
        onPress={enregistrer}
        enCours={enCours}
        desactive={!complet}
      />

      <Pressable
        onPress={deconnexion}
        disabled={enCours}
        style={({ pressed }) => [s.sortie, pressed && { opacity: PRESSION }]}
      >
        <Text style={Typo.petit}>Me déconnecter</Text>
      </Pressable>
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  bloc: { padding: Espacements.lg },
  espace: { marginTop: Espacements.md },
  label: { marginBottom: 9, color: Colors.neutre.encre },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Espacements.sm },
  detectee: { backgroundColor: Colors.prive.clair },
  detecteeRangee: { flexDirection: "row", alignItems: "center", gap: Espacements.md - 2 },
  detecteeRond: {
    width: 42,
    height: 42,
    borderRadius: Rayons.md,
    backgroundColor: Colors.neutre.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  detecteeNom: { color: Colors.prive.fonce },
  detecteeVille: { marginTop: 2 },
  listeEcoles: { marginTop: Espacements.sm + 2, gap: 6 },
  ligneEcole: { flexDirection: "row", alignItems: "center", gap: Espacements.sm },
  ville: { color: Colors.neutre.discret },
  aide: { marginTop: Espacements.md },
  sortie: { alignItems: "center", paddingVertical: Espacements.sm },
});
