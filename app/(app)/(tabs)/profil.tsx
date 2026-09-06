import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Section from "@/components/Section";
import Ligne from "@/components/Ligne";
import Bouton from "@/components/Bouton";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { getMonProfil, messageErreur, type Profil as TypeProfil } from "@/lib/api";
import { formaterOctets, stockage, supprimerMonCompte, type Stockage } from "@/lib/compte";
import { choisirEtTeleverserAvatar, retirerAvatar } from "@/lib/avatar";
import { suisJeModerateur } from "@/lib/moderation";
import { LISTE_DOCUMENTS } from "@/constants/textes-legaux";
import { Colors, Espacements, PRESSION, Rayons, Typo } from "@/constants/theme";

/** Mon profil : qui je suis, mon école, mes textes, et les deux sorties. */
export default function Profil() {
  const { deconnexion } = useAuth();
  const router = useRouter();
  const [profil, setProfil] = useState<TypeProfil | null>(null);
  const [espace, setEspace] = useState<Stockage | null>(null);
  const [moderateur, setModerateur] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [suppression, setSuppression] = useState(false);
  const [photoEnCours, setPhotoEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const [p, e, m] = await Promise.all([
        getMonProfil(),
        stockage().catch(() => null),
        suisJeModerateur().catch(() => false),
      ]);
      setProfil(p);
      setEspace(e);
      setModerateur(m);
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

  /**
   * Le menu de la photo. Deux entrees seulement, et « Retirer » n'apparait
   * que s'il y a quelque chose a retirer.
   */
  function menuPhoto() {
    if (photoEnCours) return;
    const choix: {
      text: string;
      style?: "cancel" | "destructive";
      onPress?: () => void;
    }[] = [
      { text: profil?.avatarUrl ? "Changer la photo" : "Choisir une photo", onPress: changerPhoto },
    ];
    if (profil?.avatarUrl) {
      choix.push({ text: "Retirer la photo", style: "destructive", onPress: enleverPhoto });
    }
    choix.push({ text: "Annuler", style: "cancel" });
    Alert.alert("Ma photo de profil", undefined, choix);
  }

  async function changerPhoto() {
    setPhotoEnCours(true);
    setErreur(null);
    try {
      const adresse = await choisirEtTeleverserAvatar();
      if (adresse) setProfil((p) => (p ? { ...p, avatarUrl: adresse } : p));
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setPhotoEnCours(false);
    }
  }

  async function enleverPhoto() {
    setPhotoEnCours(true);
    setErreur(null);
    try {
      await retirerAvatar();
      setProfil((p) => (p ? { ...p, avatarUrl: null } : p));
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setPhotoEnCours(false);
    }
  }

  function confirmerDeconnexion() {
    Alert.alert("Se déconnecter", "Tu devras retaper ton mot de passe.", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: deconnexion },
    ]);
  }

  /**
   * Deux confirmations pour une action irréversible. La première explique ce
   * qui disparaît, la seconde demande de le confirmer une bonne fois.
   */
  function confirmerSuppression() {
    Alert.alert(
      "Supprimer mon compte",
      "Tout disparaît définitivement : tes cours, devoirs, notes, ton emploi du temps, tes publications, et tes conversations privées, y compris les messages de tes interlocuteurs. Il n'y a pas de retour en arrière.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          style: "destructive",
          onPress: () =>
            Alert.alert("Confirmer", "Dernière vérification. On y va ?", [
              { text: "Non", style: "cancel" },
              {
                text: "Supprimer définitivement",
                style: "destructive",
                onPress: supprimer,
              },
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

  const nomComplet = [profil?.prenom, profil?.nom].filter(Boolean).join(" ");
  const pleinePart = espace ? Math.max(espace.pourcentage, 2) : 0;

  return (
    <Ecran chargement={chargement} erreur={erreur} entete={<Entete titre="Profil" />}>
      <Carte>
        <View style={s.identite}>
          <Pressable
            onPress={menuPhoto}
            accessibilityRole="button"
            accessibilityLabel="Changer ma photo de profil"
            style={({ pressed }) => pressed && { opacity: PRESSION }}
          >
            <Avatar
              nom={nomComplet || "?"}
              url={profil?.avatarUrl}
              taille={68}
              ton="prive"
            />
            <View style={s.pastillePhoto}>
              {photoEnCours ? (
                <ActivityIndicator size="small" color={Colors.neutre.blanc} />
              ) : (
                <Ionicons name="camera" size={13} color={Colors.neutre.blanc} />
              )}
            </View>
          </Pressable>
          <View style={s.flex}>
            <Text style={Typo.sousTitre} numberOfLines={1}>
              {nomComplet || "Profil incomplet"}
            </Text>
            <Text style={[Typo.petit, s.mail]} numberOfLines={1}>
              {profil?.email ?? ""}
            </Text>
            {moderateur && (
              <View style={s.roleRang}>
                <Ionicons name="shield-checkmark" size={13} color={Colors.accent.fonce} />
                <Text style={s.roleTexte}>Modérateur</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.faits}>
          {[
            { label: "Établissement", valeur: profil?.ecole?.nom ?? "Non rattaché" },
            { label: "Année", valeur: profil?.anneeEtude ?? "Non renseignée" },
            { label: "Filière", valeur: profil?.filiere ?? "Non renseignée" },
          ].map((f, i) => (
            <View key={f.label} style={[s.fait, i < 2 && s.faitTrait]}>
              <Text style={Typo.etiquette}>{f.label}</Text>
              <Text style={[Typo.corps, s.faitValeur]} numberOfLines={2}>
                {f.valeur}
              </Text>
            </View>
          ))}
        </View>
      </Carte>

      <Bouton
        titre="Modifier mes informations"
        variante="contour"
        icone="create-outline"
        pleineLargeur
        onPress={() => router.push("/(app)/onboarding")}
      />

      <Section titre="Stockage">
        <Carte>
          <View style={s.stockageHaut}>
            <Text style={Typo.corpsFort}>
              {espace ? formaterOctets(espace.utilise) : "—"}
            </Text>
            <Text style={Typo.petit}>
              sur {espace ? formaterOctets(espace.quota) : "—"}
            </Text>
          </View>
          <View style={s.jauge}>
            <View
              style={[
                s.jaugeRemplie,
                {
                  width: `${pleinePart}%`,
                  backgroundColor:
                    (espace?.pourcentage ?? 0) > 85
                      ? Colors.etat.alerte
                      : Colors.prive.base,
                },
              ]}
            />
          </View>
        </Carte>
      </Section>

      {moderateur && (
        <Section titre="Modération">
          <Carte>
            <Ligne
              titre="Signalements"
              detail="Les contenus signalés dans ton établissement"
              chevron
              dernier
              gauche={
                <View style={[s.rond, { backgroundColor: Colors.accent.clair }]}>
                  <Ionicons name="flag-outline" size={18} color={Colors.accent.fonce} />
                </View>
              }
              onPress={() => router.push("/moderation" as Href)}
            />
          </Carte>
        </Section>
      )}

      <Section titre="Le cadre">
        <Carte>
          {LISTE_DOCUMENTS.map((d, i) => (
            <Ligne
              key={d.cle}
              titre={d.titre}
              chevron
              dernier={i === LISTE_DOCUMENTS.length - 1}
              gauche={
                <View style={[s.rond, { backgroundColor: Colors.prive.clair }]}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={Colors.prive.fonce}
                  />
                </View>
              }
              onPress={() => router.push(("/document/" + d.cle) as Href)}
            />
          ))}
        </Carte>
      </Section>

      <View style={s.sorties}>
        <Bouton
          titre="Me déconnecter"
          variante="contour"
          ton="neutre"
          icone="log-out-outline"
          pleineLargeur
          onPress={confirmerDeconnexion}
        />
        <Bouton
          titre="Supprimer mon compte"
          variante="danger"
          pleineLargeur
          enCours={suppression}
          onPress={confirmerSuppression}
        />
      </View>

      <Text style={[Typo.petit, s.version]}>CampusLife · version de développement</Text>
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  identite: { flexDirection: "row", alignItems: "center", gap: Espacements.md },
  pastillePhoto: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: Rayons.rond,
    backgroundColor: Colors.prive.base,
    borderWidth: 2.5,
    borderColor: Colors.neutre.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  mail: { marginTop: 2 },
  roleRang: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  roleTexte: {
    fontFamily: Typo.petitFort.fontFamily,
    fontSize: 12,
    color: Colors.accent.fonce,
  },
  faits: {
    marginTop: Espacements.md,
    paddingTop: Espacements.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutre.traitDoux,
  },
  fait: { paddingVertical: Espacements.sm + 2 },
  faitTrait: { borderBottomWidth: 1, borderBottomColor: Colors.neutre.traitDoux },
  faitValeur: { marginTop: 3, color: Colors.neutre.encre },
  stockageHaut: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  jauge: {
    height: 6,
    borderRadius: Rayons.rond,
    backgroundColor: Colors.neutre.creux,
    marginTop: Espacements.sm + 2,
    overflow: "hidden",
  },
  jaugeRemplie: { height: 6, borderRadius: Rayons.rond },
  rond: {
    width: 38,
    height: 38,
    borderRadius: Rayons.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sorties: { gap: Espacements.sm + 4 },
  version: { textAlign: "center" },
});
