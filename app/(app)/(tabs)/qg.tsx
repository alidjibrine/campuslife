import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Section from "@/components/Section";
import Bouton from "@/components/Bouton";
import EtatVide from "@/components/EtatVide";
import Badge from "@/components/Badge";
import { getMonProfil, messageErreur, type Profil } from "@/lib/api";
import {
  formaterDate,
  joursRestants,
  listerCours,
  listerDevoirs,
  listerNotes,
  moyenne,
  type Devoir,
  type Note,
} from "@/lib/etudes";
import { formaterHeure, listerSeances } from "@/lib/agenda";
import { Colors, Espacements, Polices, Rayons, Typo } from "@/constants/theme";

/**
 * Mon QG : l'écran du matin.
 *
 * Trois questions, dans l'ordre où un étudiant se les pose en se levant :
 * qu'est-ce que j'ai aujourd'hui, qu'est-ce que je dois rendre bientôt,
 * et où j'en suis.
 *
 * La journée est dessinée comme une frise verticale, pas comme une liste :
 * ce qui est passé s'efface, ce qui vient est marqué, et on voit d'un coup
 * d'œil où on en est dans sa journée.
 */

type LigneProgramme = {
  cle: string;
  heure: string;
  intitule: string;
  salle: string | null;
};

export default function MonQG() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [programme, setProgramme] = useState<LigneProgramme[]>([]);
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const debutJour = new Date();
      debutJour.setHours(0, 0, 0, 0);
      const finJour = new Date();
      finJour.setHours(23, 59, 59, 999);
      const jourActuel = ((debutJour.getDay() + 6) % 7) + 1;

      const [p, d, c, n, se] = await Promise.all([
        getMonProfil(),
        listerDevoirs(),
        listerCours(),
        listerNotes(),
        listerSeances(debutJour, finJour),
      ]);

      setProfil(p);
      setErreur(null);
      setDevoirs(d.filter((x) => !x.fait));
      setNotes(n);
      setProgramme(
        [
          ...se.map((x) => ({
            cle: x.id,
            heure: formaterHeure(x.debut),
            intitule: x.intitule,
            salle: x.salle,
          })),
          ...c
            .filter((x) => x.jour === jourActuel)
            .map((x) => ({
              cle: x.id,
              heure: x.debut,
              intitule: x.intitule,
              salle: x.salle,
            })),
        ].sort((a, b) => a.heure.localeCompare(b.heure)),
      );
    } catch (e) {
      // Ne jamais échouer en silence : un écran vide sans explication est le
      // pire des retours pour quelqu'un qui teste l'app.
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

  const maintenant = new Date();
  const minutesMaintenant = maintenant.getHours() * 60 + maintenant.getMinutes();
  const heureActuelle =
    String(maintenant.getHours()).padStart(2, "0") +
    ":" +
    String(maintenant.getMinutes()).padStart(2, "0");
  const prochaine = programme.find((x) => x.heure >= heureActuelle) ?? null;

  const troisDevoirs = devoirs
    .slice()
    .sort((a, b) => {
      if (!a.echeance) return 1;
      if (!b.echeance) return -1;
      return a.echeance.localeCompare(b.echeance);
    })
    .slice(0, 3);

  const generale = moyenne(notes);
  const derniere = notes[0] ?? null;

  const salutation =
    maintenant.getHours() < 12
      ? "Bonjour"
      : maintenant.getHours() < 18
        ? "Bon après-midi"
        : "Bonsoir";

  /** « dans 1 h 20 », pour le prochain cours seulement. */
  function delai(heure: string): string | null {
    const [h, m] = heure.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const ecart = h * 60 + m - minutesMaintenant;
    if (ecart < 0) return null;
    if (ecart < 1) return "maintenant";
    if (ecart < 60) return "dans " + ecart + " min";
    const heures = Math.floor(ecart / 60);
    const reste = ecart % 60;
    return "dans " + heures + " h" + (reste ? " " + String(reste).padStart(2, "0") : "");
  }

  return (
    <Ecran
      chargement={chargement}
      erreur={erreur}
      rafraichit={rafraichit}
      surRafraichir={() => {
        setRafraichit(true);
        charger();
      }}
      entete={
        <Entete
          surtitre={maintenant.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          titre={salutation + (profil?.prenom ? " " + profil.prenom : "")}
          sousTitre={profil?.ecole?.nom ?? undefined}
        />
      }
    >
      {/* Le prochain cours, en grand. C'est la seule information qu'on
          regarde vraiment en attrapant son téléphone le matin. */}
      {prochaine ? (
        <Carte style={s.prochaineCarte}>
          <View style={s.prochaineHaut}>
            <Text style={[Typo.etiquette, s.prochaineLabel]}>Prochain cours</Text>
            {!!delai(prochaine.heure) && (
              <View style={s.delai}>
                <Text style={s.delaiTexte}>{delai(prochaine.heure)}</Text>
              </View>
            )}
          </View>
          <Text style={[Typo.chiffre, s.prochaineHeure]}>{prochaine.heure}</Text>
          <Text style={[Typo.sousTitre, s.prochaineTitre]} numberOfLines={2}>
            {prochaine.intitule}
          </Text>
          {!!prochaine.salle && (
            <View style={s.salle}>
              <Ionicons name="location-outline" size={14} color={Colors.prive.clair} />
              <Text style={s.salleTexte}>{prochaine.salle}</Text>
            </View>
          )}
        </Carte>
      ) : null}

      <Section
        titre="Aujourd'hui"
        lien={
          programme.length > 0
            ? { libelle: "La semaine", onPress: () => router.push("/emploi-du-temps" as Href) }
            : undefined
        }
      >
        {programme.length === 0 ? (
          <EtatVide
            icone="calendar-outline"
            titre="Rien au programme"
            texte="Importe ton emploi du temps universitaire, ou ajoute tes cours à la main. Ensuite, cet écran se remplit tout seul."
            action={
              <Bouton
                titre="Importer mon agenda"
                icone="download-outline"
                onPress={() => router.push("/emploi-du-temps" as Href)}
              />
            }
          />
        ) : (
          <Carte>
            {programme.map((x, i) => {
              const passe = x.heure < heureActuelle;
              const cestLaProchaine = prochaine?.cle === x.cle;
              const dernier = i === programme.length - 1;
              return (
                <View key={x.cle} style={s.frise}>
                  <View style={s.rail}>
                    <View
                      style={[
                        s.point,
                        passe && s.pointPasse,
                        cestLaProchaine && s.pointProchain,
                      ]}
                    />
                    {!dernier && <View style={s.trait} />}
                  </View>
                  <View style={[s.friseContenu, dernier && s.friseDerniere]}>
                    <Text style={[s.friseHeure, passe && s.efface]}>{x.heure}</Text>
                    <Text
                      style={[
                        Typo.corpsFort,
                        s.friseTitre,
                        passe && s.efface,
                        cestLaProchaine && s.friseTitreProchain,
                      ]}
                      numberOfLines={2}
                    >
                      {x.intitule}
                    </Text>
                    {!!x.salle && (
                      <Text style={[Typo.petit, passe && s.efface]}>{x.salle}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Carte>
        )}
      </Section>

      <Section
        titre="À rendre"
        lien={
          devoirs.length > 0
            ? { libelle: "Tout voir", onPress: () => router.push("/devoirs" as Href) }
            : undefined
        }
      >
        {troisDevoirs.length === 0 ? (
          <Carte variante="creux">
            <View style={s.rienARendre}>
              <Ionicons name="checkmark-done" size={20} color={Colors.etat.succes} />
              <Text style={Typo.corpsFort}>Rien à rendre. Profites-en.</Text>
            </View>
          </Carte>
        ) : (
          <Carte>
            {troisDevoirs.map((d, i) => {
              const jours = joursRestants(d.echeance);
              const retard = jours !== null && jours < 0;
              const urgent = jours !== null && jours >= 0 && jours <= 2;
              return (
                <View
                  key={d.id}
                  style={[s.devoir, i < troisDevoirs.length - 1 && s.devoirTrait]}
                >
                  <View style={s.flex}>
                    <Text style={Typo.corpsFort} numberOfLines={2}>
                      {d.titre}
                    </Text>
                    <Text style={[Typo.petit, s.devoirDetail]}>
                      {[d.matiere, formaterDate(d.echeance)].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  {jours !== null && (
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
            })}
          </Carte>
        )}
      </Section>

      <Section titre="Ma moyenne">
        <Carte onPress={() => router.push("/notes" as Href)}>
          <View style={s.moyenne}>
            <View>
              <Text style={Typo.chiffre}>
                {generale === null ? "—" : generale.toFixed(2).replace(".", ",")}
              </Text>
              <Text style={[Typo.petit, s.moyenneLabel]}>
                {generale === null
                  ? "Aucune note saisie"
                  : "sur 20 · " + notes.length + (notes.length > 1 ? " notes" : " note")}
              </Text>
            </View>
            <View style={s.flex} />
            {!!derniere && (
              <View style={s.derniere}>
                <Text style={Typo.etiquette}>Dernière</Text>
                <Text style={[Typo.sousTitre, s.derniereValeur]}>
                  {derniere.valeur.toString().replace(".", ",")}
                  <Text style={s.bareme}>/{derniere.bareme}</Text>
                </Text>
                <Text style={[Typo.petit, s.derniereMatiere]} numberOfLines={1}>
                  {derniere.matiere ?? derniere.intitule}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={Colors.neutre.fantome} />
          </View>
        </Carte>
      </Section>
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },

  prochaineCarte: { backgroundColor: Colors.prive.fonce, padding: Espacements.lg },
  prochaineHaut: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  prochaineLabel: { color: Colors.prive.surligne },
  delai: {
    backgroundColor: Colors.neutre.voile,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Rayons.rond,
  },
  delaiTexte: {
    fontFamily: Polices.corpsFort,
    fontSize: 12,
    color: Colors.neutre.blanc,
  },
  prochaineHeure: { color: Colors.neutre.blanc, marginTop: Espacements.sm },
  prochaineTitre: { color: Colors.neutre.blanc, marginTop: 2 },
  salle: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  salleTexte: { fontFamily: Polices.corps, fontSize: 13.5, color: Colors.prive.surligne },

  frise: { flexDirection: "row", gap: Espacements.md - 2 },
  rail: { alignItems: "center", width: 12 },
  point: {
    width: 10,
    height: 10,
    borderRadius: Rayons.rond,
    backgroundColor: Colors.prive.base,
    marginTop: 6,
  },
  pointPasse: { backgroundColor: Colors.neutre.trait },
  pointProchain: {
    backgroundColor: Colors.accent.base,
    width: 12,
    height: 12,
    marginTop: 5,
    borderWidth: 3,
    borderColor: Colors.accent.clair,
  },
  trait: { flex: 1, width: 2, backgroundColor: Colors.neutre.traitDoux, marginTop: 4 },
  friseContenu: { flex: 1, paddingBottom: Espacements.md },
  friseDerniere: { paddingBottom: 0 },
  friseHeure: {
    fontFamily: Polices.corpsGras,
    fontSize: 13,
    color: Colors.prive.fonce,
    letterSpacing: 0.2,
  },
  friseTitre: { marginTop: 1 },
  friseTitreProchain: { color: Colors.accent.fonce },
  efface: { color: Colors.neutre.fantome },

  rienARendre: { flexDirection: "row", alignItems: "center", gap: Espacements.sm + 2 },

  devoir: { flexDirection: "row", alignItems: "center", gap: Espacements.md, paddingVertical: 12 },
  devoirTrait: { borderBottomWidth: 1, borderBottomColor: Colors.neutre.traitDoux },
  devoirDetail: { marginTop: 2 },

  moyenne: { flexDirection: "row", alignItems: "center", gap: Espacements.md },
  moyenneLabel: { marginTop: 2 },
  derniere: { alignItems: "flex-end" },
  derniereValeur: { marginTop: 3 },
  bareme: { fontFamily: Polices.corps, fontSize: 13, color: Colors.neutre.discret },
  derniereMatiere: { marginTop: 1, maxWidth: 130, textAlign: "right" },
});
