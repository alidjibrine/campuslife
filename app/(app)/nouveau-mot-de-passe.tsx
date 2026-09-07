import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Bouton from "@/components/Bouton";
import Alerte from "@/components/Alerte";
import { useAuth } from "@/contexts/AuthContext";
import { definirMotDePasse, messageErreur } from "@/lib/api";
import { Espacements } from "@/constants/theme";

/**
 * Le nouveau mot de passe, après avoir cliqué sur le lien reçu par courriel.
 *
 * Cet écran vit dans l'espace connecté et non dans l'espace public : le lien
 * de réinitialisation ouvre déjà une session, l'étudiant est donc techniquement
 * connecté quand il arrive ici. La garde du groupe l'envoie directement dessus,
 * avant même l'onboarding.
 */
export default function NouveauMotDePasse() {
  const router = useRouter();
  const { finirRecuperation, deconnexion } = useAuth();
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const tropCourt = motDePasse.length > 0 && motDePasse.length < 6;
  const differents = confirmation.length > 0 && confirmation !== motDePasse;
  const peutValider = motDePasse.length >= 6 && confirmation === motDePasse && !enCours;

  async function enregistrer() {
    if (!peutValider) return;
    setEnCours(true);
    setErreur(null);
    try {
      await definirMotDePasse(motDePasse);
      finirRecuperation();
      router.replace("/qg");
    } catch (e) {
      setErreur(messageErreur(e));
      setEnCours(false);
    }
  }

  return (
    <Ecran
      clavier
      entete={
        <Entete
          surtitre="Réinitialisation"
          titre="Nouveau mot de passe"
          sousTitre="Choisis-en un que tu retiendras. Il remplace l'ancien immédiatement."
        />
      }
    >
      <Carte style={s.carte}>
        <Champ
          label="Nouveau mot de passe"
          value={motDePasse}
          onChangeText={setMotDePasse}
          placeholder="6 caractères minimum"
          secureTextEntry
          autoCapitalize="none"
          editable={!enCours}
          erreur={tropCourt ? "Six caractères au minimum." : null}
        />
        <Champ
          conteneur={s.espace}
          label="Confirmation"
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder="Le même, une seconde fois"
          secureTextEntry
          autoCapitalize="none"
          editable={!enCours}
          erreur={differents ? "Les deux ne correspondent pas." : null}
        />

        {!!erreur && (
          <View style={s.espace}>
            <Alerte type="erreur" texte={erreur} />
          </View>
        )}

        <View style={s.espace}>
          <Bouton
            titre="Enregistrer"
            pleineLargeur
            onPress={enregistrer}
            enCours={enCours}
            desactive={!peutValider}
          />
        </View>
      </Carte>

      <Bouton
        titre="Annuler et me déconnecter"
        variante="discret"
        ton="neutre"
        pleineLargeur
        onPress={deconnexion}
        desactive={enCours}
      />
    </Ecran>
  );
}

const s = StyleSheet.create({
  carte: { padding: Espacements.lg },
  espace: { marginTop: Espacements.md },
});
