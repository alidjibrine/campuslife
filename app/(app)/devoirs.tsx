import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Bouton from "@/components/Bouton";
import Badge from "@/components/Badge";
import Section from "@/components/Section";
import EtatVide from "@/components/EtatVide";
import {
  basculerDevoir,
  creerDevoir,
  formaterDate,
  joursRestants,
  listerDevoirs,
  supprimerDevoir,
  type Devoir,
} from "@/lib/etudes";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, PRESSION, Rayons, Typo } from "@/constants/theme";

/**
 * Mes devoirs.
 *
 * Triés par échéance, les faits repoussés en bas. L'ajout se fait dans un
 * formulaire qui se déplie sur place : pas de navigation, pas d'écran de plus.
 *
 * L'échéance se saisit en JJ/MM, l'année est déduite. Un étudiant ne tape pas
 * "2026-09-12" à la main.
 */
export default function Devoirs() {
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [formOuvert, setFormOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [matiere, setMatiere] = useState("");
  const [echeance, setEcheance] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setDevoirs(await listerDevoirs());
      setErreur(null);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
      setRafraichit(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  /** "12/09" devient "2026-09-12". Si la date est passée, on vise l'an prochain. */
  function versIso(saisie: string): string | null {
    const m = saisie.trim().match(/^(\d{1,2})[/.-](\d{1,2})$/);
    if (!m) return null;
    const jour = Number(m[1]);
    const mois = Number(m[2]);
    if (jour < 1 || jour > 31 || mois < 1 || mois > 12) return null;
    const maintenant = new Date();
    let annee = maintenant.getFullYear();
    const essai = new Date(annee, mois - 1, jour, 12);
    if (essai.getTime() < maintenant.getTime() - 86400000) annee += 1;
    return annee + "-" + String(mois).padStart(2, "0") + "-" + String(jour).padStart(2, "0");
  }

  const echeanceIso = echeance.trim() ? versIso(echeance) : null;
  const echeanceInvalide = echeance.trim().length > 0 && echeanceIso === null;
  const peutValider = titre.trim().length > 1 && !echeanceInvalide && !enCours;

  async function ajouter() {
    if (!peutValider) return;
    setEnCours(true);
    try {
      await creerDevoir({ titre, matiere: matiere || null, echeance: echeanceIso });
      setTitre("");
      setMatiere("");
      setEcheance("");
      setFormOuvert(false);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  async function cocher(d: Devoir) {
    setDevoirs((liste) =>
      liste.map((x) => (x.id === d.id ? { ...x, fait: !x.fait } : x)),
    );
    try {
      await basculerDevoir(d.id, !d.fait);
    } catch (e) {
      setErreur(messageErreur(e));
      await charger();
    }
  }

  async function supprimer(id: string) {
    setDevoirs((liste) => liste.filter((d) => d.id !== id));
    try {
      await supprimerDevoir(id);
    } catch (e) {
      setErreur(messageErreur(e));
      await charger();
    }
  }

  const aRendre = devoirs.filter((d) => !d.fait);
  const termines = devoirs.filter((d) => d.fait);

  function rendu(d: Devoir, dernier: boolean) {
    const jours = joursRestants(d.echeance);
    const retard = !d.fait && jours !== null && jours < 0;
    const urgent = !d.fait && jours !== null && jours >= 0 && jours <= 2;
    return (
      <View key={d.id} style={[s.ligne, !dernier && s.trait]}>
        <Pressable
          onPress={() => cocher(d)}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: d.fait }}
          style={({ pressed }) => [
            s.case,
            d.fait && s.caseCochee,
            pressed && { opacity: PRESSION },
          ]}
        >
          {d.fait && <Ionicons name="checkmark" size={15} color={Colors.neutre.blanc} />}
        </Pressable>

        <Pressable
          style={s.flex}
          onLongPress={() => supprimer(d.id)}
          onPress={() => cocher(d)}
        >
          <Text style={[Typo.corpsFort, d.fait && s.fait]} numberOfLines={2}>
            {d.titre}
          </Text>
          <Text style={[Typo.petit, s.detail]}>
            {[d.matiere, formaterDate(d.echeance)].filter(Boolean).join(" · ")}
          </Text>
        </Pressable>

        {!d.fait && jours !== null && (
          <Badge
            ton={retard ? "erreur" : urgent ? "accent" : "neutre"}
            variante="doux"
            valeur={
              retard
                ? "en retard"
                : jours === 0
                  ? "aujourd'hui"
                  : jours === 1
                    ? "demain"
                    : "J-" + jours
            }
          />
        )}
      </View>
    );
  }

  return (
    <Ecran
      clavier
      chargement={chargement}
      erreur={erreur}
      rafraichit={rafraichit}
      surRafraichir={() => {
        setRafraichit(true);
        charger();
      }}
      entete={
        <Entete
          retour
          surtitre="Espace privé"
          titre="Mes devoirs"
          sousTitre={
            aRendre.length > 0
              ? aRendre.length + (aRendre.length > 1 ? " devoirs à rendre" : " devoir à rendre")
              : "Rien à rendre"
          }
          action={
            !formOuvert ? (
              <Bouton
                titre="Ajouter"
                taille="sm"
                icone="add"
                onPress={() => setFormOuvert(true)}
              />
            ) : undefined
          }
        />
      }
    >
      {formOuvert && (
        <Carte style={s.form}>
          <Champ
            label="Quoi"
            value={titre}
            onChangeText={setTitre}
            placeholder="Dissertation sur les obligations"
            editable={!enCours}
          />
          <Champ
            conteneur={s.espace}
            label="Matière"
            value={matiere}
            onChangeText={setMatiere}
            placeholder="Droit civil"
            editable={!enCours}
            aide="Facultatif."
          />
          <Champ
            conteneur={s.espace}
            label="Pour quand"
            value={echeance}
            onChangeText={setEcheance}
            placeholder="12/09"
            keyboardType="numbers-and-punctuation"
            editable={!enCours}
            erreur={echeanceInvalide ? "Format attendu : jour/mois, par exemple 12/09." : null}
            aide="Jour/mois. Laisse vide s'il n'y a pas de date."
          />
          <View style={s.actions}>
            <Bouton
              titre="Annuler"
              variante="discret"
              taille="sm"
              onPress={() => setFormOuvert(false)}
              desactive={enCours}
            />
            <Bouton
              titre="Ajouter"
              taille="sm"
              onPress={ajouter}
              enCours={enCours}
              desactive={!peutValider}
            />
          </View>
        </Carte>
      )}

      {devoirs.length === 0 && !formOuvert ? (
        <EtatVide
          icone="checkbox-outline"
          titre="Aucun devoir en attente"
          texte="Ajoute ce que tu dois rendre, tu le retrouveras sur ton QG le matin."
          action={<Bouton titre="Ajouter un devoir" icone="add" onPress={() => setFormOuvert(true)} />}
        />
      ) : (
        <>
          {aRendre.length > 0 && (
            <Section titre="À rendre">
              <Carte>{aRendre.map((d, i) => rendu(d, i === aRendre.length - 1))}</Carte>
            </Section>
          )}
          {termines.length > 0 && (
            <Section titre={"Terminés · " + termines.length}>
              <Carte>{termines.map((d, i) => rendu(d, i === termines.length - 1))}</Carte>
            </Section>
          )}
          <Text style={[Typo.petit, s.astuce]}>
            Touche un devoir pour le cocher. Appui long pour le supprimer.
          </Text>
        </>
      )}
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  form: { padding: Espacements.lg },
  espace: { marginTop: Espacements.md },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Espacements.sm,
    marginTop: Espacements.lg,
  },
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.md - 2,
    paddingVertical: Espacements.sm + 4,
  },
  trait: { borderBottomWidth: 1, borderBottomColor: Colors.neutre.traitDoux },
  case: {
    width: 24,
    height: 24,
    borderRadius: Rayons.sm,
    borderWidth: 2,
    borderColor: Colors.neutre.trait,
    alignItems: "center",
    justifyContent: "center",
  },
  caseCochee: { backgroundColor: Colors.etat.succes, borderColor: Colors.etat.succes },
  fait: { color: Colors.neutre.fantome, textDecorationLine: "line-through" },
  detail: { marginTop: 2 },
  astuce: { textAlign: "center" },
});
