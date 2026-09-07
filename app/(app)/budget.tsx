import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Ecran from "@/components/Ecran";
import Entete from "@/components/Entete";
import Carte from "@/components/Carte";
import Champ from "@/components/Champ";
import Puce from "@/components/Puce";
import Bouton from "@/components/Bouton";
import Section from "@/components/Section";
import Alerte from "@/components/Alerte";
import EtatVide from "@/components/EtatVide";
import {
  CATEGORIES_BUDGET,
  creerDepense,
  debutDuMois,
  definirBudgetMensuel,
  definirEnveloppe,
  formaterEuros,
  formaterJour,
  libelleMois,
  listerDepenses,
  listerEnveloppes,
  lireReglages,
  modifierDepense,
  parCategorie,
  supprimerDepense,
  totalDepense,
  totalRentrees,
  type Depense,
  type Enveloppe,
  type Reglages,
} from "@/lib/budget";
import { messageErreur } from "@/lib/api";
import { Colors, Espacements, PRESSION, Polices, Rayons, Typo } from "@/constants/theme";

/**
 * Le budget du mois.
 *
 * Un montant positif est une dépense, un montant négatif une rentrée. L'écran
 * ne fait jamais taper de signe moins : deux puces suffisent, et neuf fois sur
 * dix c'est une dépense.
 */
export default function Budget() {
  const [decalageMois, setDecalageMois] = useState(0);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [enveloppes, setEnveloppes] = useState<Enveloppe[]>([]);
  const [reglages, setReglages] = useState<Reglages | null>(null);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Saisie d'une dépense
  const [formOuvert, setFormOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [sens, setSens] = useState<"depense" | "rentree">("depense");
  const [montant, setMontant] = useState("");
  const [categorie, setCategorie] = useState<string>(CATEGORIES_BUDGET[0]);
  const [note, setNote] = useState("");
  const [jourMois, setJourMois] = useState("");
  const [enCours, setEnCours] = useState(false);

  // Réglages
  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const [budgetSaisi, setBudgetSaisi] = useState("");
  const [categorieEnveloppe, setCategorieEnveloppe] = useState<string>(CATEGORIES_BUDGET[0]);
  const [plafondSaisi, setPlafondSaisi] = useState("");

  const mois = new Date();
  mois.setDate(1);
  mois.setMonth(mois.getMonth() + decalageMois);

  const charger = useCallback(async () => {
    try {
      const cible = new Date();
      cible.setDate(1);
      cible.setMonth(cible.getMonth() + decalageMois);
      const [d, e, r] = await Promise.all([
        listerDepenses(cible),
        listerEnveloppes(),
        lireReglages(),
      ]);
      setDepenses(d);
      setEnveloppes(e);
      setReglages(r);
      setErreur(null);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
      setRafraichit(false);
    }
  }, [decalageMois]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const nombre = (t: string) => Number(t.replace(",", ".").replace(/\s/g, ""));
  const montantNum = nombre(montant);
  const montantValide = Number.isFinite(montantNum) && montantNum > 0;

  /** "12/09" devient "2026-09-12". Vide vaut aujourd'hui. */
  function versIso(saisie: string): string | null {
    const propre = saisie.trim();
    if (!propre) {
      const a = new Date();
      return (
        a.getFullYear() +
        "-" +
        String(a.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(a.getDate()).padStart(2, "0")
      );
    }
    const m = propre.match(/^(\d{1,2})[/.-](\d{1,2})$/);
    if (!m) return null;
    const jour = Number(m[1]);
    const moisSaisi = Number(m[2]);
    if (jour < 1 || jour > 31 || moisSaisi < 1 || moisSaisi > 12) return null;
    return (
      mois.getFullYear() +
      "-" +
      String(moisSaisi).padStart(2, "0") +
      "-" +
      String(jour).padStart(2, "0")
    );
  }

  const dateIso = versIso(jourMois);
  const dateInvalide = jourMois.trim().length > 0 && dateIso === null;
  const peutValider = montantValide && !dateInvalide && !enCours;

  function fermerForm() {
    setFormOuvert(false);
    setEnEdition(null);
    setSens("depense");
    setMontant("");
    setNote("");
    setJourMois("");
    setCategorie(CATEGORIES_BUDGET[0]);
  }

  function ouvrirModification(d: Depense) {
    setEnEdition(d.id);
    setSens(d.montant < 0 ? "rentree" : "depense");
    setMontant(String(Math.abs(d.montant)).replace(".", ","));
    setCategorie(d.categorie ?? CATEGORIES_BUDGET[0]);
    setNote(d.note ?? "");
    setJourMois(d.date ? d.date.slice(8, 10) + "/" + d.date.slice(5, 7) : "");
    setFormOuvert(true);
  }

  async function enregistrer() {
    if (!peutValider || !dateIso) return;
    setEnCours(true);
    try {
      const champs = {
        montant: sens === "rentree" ? -montantNum : montantNum,
        categorie: sens === "rentree" ? null : categorie,
        note: note || null,
        date: dateIso,
      };
      if (enEdition) {
        await modifierDepense(enEdition, champs);
      } else {
        await creerDepense(champs);
      }
      fermerForm();
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  function menu(d: Depense) {
    Alert.alert(formaterEuros(Math.abs(d.montant)), d.note ?? undefined, [
      { text: "Modifier", onPress: () => ouvrirModification(d) },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setDepenses((liste) => liste.filter((x) => x.id !== d.id));
          try {
            await supprimerDepense(d.id);
          } catch (e) {
            setErreur(messageErreur(e));
            await charger();
          }
        },
      },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  async function enregistrerReglages() {
    setEnCours(true);
    try {
      const budget = budgetSaisi.trim() ? nombre(budgetSaisi) : null;
      if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
        throw new Error("Le budget mensuel doit être un nombre positif.");
      }
      await definirBudgetMensuel(budget);

      if (plafondSaisi.trim()) {
        const plafond = nombre(plafondSaisi);
        if (!Number.isFinite(plafond) || plafond < 0) {
          throw new Error("Le plafond doit être un nombre positif.");
        }
        await definirEnveloppe(categorieEnveloppe, plafond);
      }

      setPlafondSaisi("");
      setReglagesOuverts(false);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  const depense = totalDepense(depenses);
  const rentrees = totalRentrees(depenses);
  const lignes = parCategorie(depenses, enveloppes);
  const budget = reglages?.budgetMensuel ?? null;
  const partBudget = budget && budget > 0 ? Math.min(100, (depense / budget) * 100) : 0;
  const seuilAlerte = reglages?.seuilAlerte ?? 75;
  const seuilDanger = reglages?.seuilDanger ?? 100;
  const couleurJauge =
    budget && depense / budget >= seuilDanger / 100
      ? Colors.etat.erreur
      : budget && depense / budget >= seuilAlerte / 100
        ? Colors.accent.base
        : Colors.social.base;

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
          titre="Budget"
          action={
            !formOuvert ? (
              <Bouton
                titre="Ajouter"
                taille="sm"
                icone="add"
                onPress={() => {
                  setEnEdition(null);
                  setFormOuvert(true);
                }}
              />
            ) : undefined
          }
        />
      }
    >
      <View style={s.navigation}>
        <Pressable
          onPress={() => setDecalageMois((m) => m - 1)}
          hitSlop={8}
          accessibilityLabel="Mois précédent"
          style={({ pressed }) => [s.fleche, pressed && { opacity: PRESSION }]}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.neutre.encre} />
        </Pressable>
        <Pressable
          onPress={() => setDecalageMois(0)}
          style={({ pressed }) => [s.mois, pressed && { opacity: PRESSION }]}
        >
          <Text style={[Typo.corpsFort, s.moisTexte]}>{libelleMois(mois)}</Text>
        </Pressable>
        <Pressable
          onPress={() => setDecalageMois((m) => m + 1)}
          hitSlop={8}
          accessibilityLabel="Mois suivant"
          style={({ pressed }) => [s.fleche, pressed && { opacity: PRESSION }]}
        >
          <Ionicons name="chevron-forward" size={18} color={Colors.neutre.encre} />
        </Pressable>
      </View>

      <Carte style={s.total}>
        <Text style={[Typo.etiquette, s.totalLabel]}>Dépensé ce mois</Text>
        <Text style={s.totalChiffre}>{formaterEuros(depense)}</Text>
        {budget !== null && budget > 0 ? (
          <>
            <View style={s.jauge}>
              <View
                style={[
                  s.jaugeRemplie,
                  { width: `${Math.max(partBudget, 1.5)}%`, backgroundColor: couleurJauge },
                ]}
              />
            </View>
            <Text style={[Typo.petit, s.totalDetail]}>
              sur {formaterEuros(budget)} · il te reste {formaterEuros(budget - depense)}
            </Text>
          </>
        ) : (
          <Text style={[Typo.petit, s.totalDetail]}>
            Aucun budget mensuel fixé. Sans lui, l&apos;app compte mais ne prévient de rien.
          </Text>
        )}
        {rentrees > 0 && (
          <Text style={[Typo.petit, s.totalDetail]}>
            {formaterEuros(rentrees)} de rentrées ce mois
          </Text>
        )}
      </Carte>

      {formOuvert && (
        <Carte style={s.form}>
          <View style={s.puces}>
            <Puce
              libelle="Dépense"
              actif={sens === "depense"}
              onPress={() => setSens("depense")}
              desactive={enCours}
            />
            <Puce
              libelle="Rentrée"
              actif={sens === "rentree"}
              onPress={() => setSens("rentree")}
              desactive={enCours}
            />
          </View>

          <Champ
            conteneur={s.espace}
            label="Montant"
            value={montant}
            onChangeText={setMontant}
            placeholder="12,50"
            keyboardType="decimal-pad"
            editable={!enCours}
          />

          {sens === "depense" && (
            <View style={s.espace}>
              <Text style={[Typo.petitFort, s.label]}>Catégorie</Text>
              <View style={s.puces}>
                {CATEGORIES_BUDGET.map((c) => (
                  <Puce
                    key={c}
                    libelle={c}
                    actif={categorie === c}
                    onPress={() => setCategorie(c)}
                    desactive={enCours}
                  />
                ))}
              </View>
            </View>
          )}

          <Champ
            conteneur={s.espace}
            label="Note"
            value={note}
            onChangeText={setNote}
            placeholder="Courses de la semaine"
            editable={!enCours}
            aide="Facultatif."
          />

          <Champ
            conteneur={s.espace}
            label="Date"
            value={jourMois}
            onChangeText={setJourMois}
            placeholder="12/09"
            keyboardType="numbers-and-punctuation"
            editable={!enCours}
            erreur={dateInvalide ? "Format attendu : jour/mois, par exemple 12/09." : null}
            aide="Vide vaut aujourd'hui."
          />

          <View style={s.actions}>
            <Bouton
              titre="Annuler"
              variante="discret"
              taille="sm"
              onPress={fermerForm}
              desactive={enCours}
            />
            <Bouton
              titre={enEdition ? "Enregistrer" : "Ajouter"}
              taille="sm"
              onPress={enregistrer}
              enCours={enCours}
              desactive={!peutValider}
            />
          </View>
        </Carte>
      )}

      <Section
        titre="Par catégorie"
        lien={{
          libelle: reglagesOuverts ? "Fermer" : "Régler",
          onPress: () => {
            setBudgetSaisi(budget !== null ? String(budget).replace(".", ",") : "");
            setReglagesOuverts((o) => !o);
          },
        }}
      >
        {reglagesOuverts && (
          <Carte style={s.form}>
            <Champ
              label="Budget mensuel"
              value={budgetSaisi}
              onChangeText={setBudgetSaisi}
              placeholder="600"
              keyboardType="decimal-pad"
              editable={!enCours}
              aide="Laisse vide pour ne pas en fixer."
            />

            <View style={s.espace}>
              <Text style={[Typo.petitFort, s.label]}>Plafond d&apos;une catégorie</Text>
              <View style={s.puces}>
                {CATEGORIES_BUDGET.map((c) => (
                  <Puce
                    key={c}
                    libelle={c}
                    actif={categorieEnveloppe === c}
                    onPress={() => {
                      setCategorieEnveloppe(c);
                      const e = enveloppes.find((x) => x.categorie === c);
                      setPlafondSaisi(e ? String(e.plafond).replace(".", ",") : "");
                    }}
                    desactive={enCours}
                  />
                ))}
              </View>
            </View>

            <Champ
              conteneur={s.espace}
              label={"Plafond pour " + categorieEnveloppe}
              value={plafondSaisi}
              onChangeText={setPlafondSaisi}
              placeholder="150"
              keyboardType="decimal-pad"
              editable={!enCours}
              aide="Zéro retire le plafond."
            />

            <View style={s.actions}>
              <Bouton
                titre="Annuler"
                variante="discret"
                taille="sm"
                onPress={() => setReglagesOuverts(false)}
                desactive={enCours}
              />
              <Bouton
                titre="Enregistrer"
                taille="sm"
                onPress={enregistrerReglages}
                enCours={enCours}
              />
            </View>
          </Carte>
        )}

        {lignes.length === 0 ? (
          <Alerte
            type="info"
            texte="Rien de dépensé ce mois. Ajoute une dépense pour voir la répartition apparaître."
          />
        ) : (
          <Carte>
            {lignes.map((l, i) => {
              const depasse = l.plafond !== null && l.depense > l.plafond;
              const part =
                l.plafond && l.plafond > 0
                  ? Math.min(100, (l.depense / l.plafond) * 100)
                  : l.part * 100;
              return (
                <View
                  key={l.categorie}
                  style={[s.categorie, i < lignes.length - 1 && s.trait]}
                >
                  <View style={s.categorieHaut}>
                    <Text style={[Typo.corpsFort, s.flex]}>{l.categorie}</Text>
                    <Text style={[s.montantCat, depasse && s.depasse]}>
                      {formaterEuros(l.depense)}
                    </Text>
                  </View>
                  <View style={s.barre}>
                    <View
                      style={[
                        s.barreRemplie,
                        {
                          width: `${Math.max(part, 1.5)}%`,
                          backgroundColor: depasse
                            ? Colors.etat.erreur
                            : l.plafond
                              ? Colors.social.base
                              : Colors.prive.surligne,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[Typo.petit, s.categorieDetail]}>
                    {l.plafond !== null
                      ? "plafond " + formaterEuros(l.plafond) + (depasse ? " · dépassé" : "")
                      : Math.round(l.part * 100) + " % de tes dépenses"}
                  </Text>
                </View>
              );
            })}
          </Carte>
        )}
      </Section>

      <Section titre={"Ce mois · " + depenses.length}>
        {depenses.length === 0 ? (
          <EtatVide
            icone="wallet-outline"
            titre="Aucune dépense"
            texte="Saisis ce que tu dépenses au fil de l'eau. C'est en le voyant écrit qu'on découvre où part l'argent."
            action={
              <Bouton
                titre="Ajouter une dépense"
                icone="add"
                onPress={() => {
                  setEnEdition(null);
                  setFormOuvert(true);
                }}
              />
            }
          />
        ) : (
          <>
            <Carte>
              {depenses.map((d, i) => (
                <Pressable
                  key={d.id}
                  onPress={() => ouvrirModification(d)}
                  onLongPress={() => menu(d)}
                  style={({ pressed }) => [
                    s.depense,
                    i < depenses.length - 1 && s.trait,
                    pressed && { opacity: PRESSION },
                  ]}
                >
                  <Text style={s.jour}>{formaterJour(d.date)}</Text>
                  <View style={s.flex}>
                    <Text style={Typo.corpsFort} numberOfLines={1}>
                      {d.note || d.categorie || (d.montant < 0 ? "Rentrée" : "Dépense")}
                    </Text>
                    <Text style={Typo.petit}>
                      {d.montant < 0 ? "Rentrée" : (d.categorie ?? "Sans catégorie")}
                    </Text>
                  </View>
                  <Text style={[s.montantLigne, d.montant < 0 && s.rentree]}>
                    {(d.montant < 0 ? "+" : "") + formaterEuros(Math.abs(d.montant))}
                  </Text>
                </Pressable>
              ))}
            </Carte>
            <Text style={[Typo.petit, s.astuce]}>
              Touche une ligne pour la modifier. Appui long pour le menu.
            </Text>
          </>
        )}
      </Section>
    </Ecran>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.sm,
    backgroundColor: Colors.neutre.surface,
    borderRadius: Rayons.md,
    padding: 6,
  },
  fleche: {
    width: 36,
    height: 36,
    borderRadius: Rayons.sm,
    backgroundColor: Colors.neutre.creux,
    alignItems: "center",
    justifyContent: "center",
  },
  mois: { flex: 1, alignItems: "center" },
  moisTexte: { textTransform: "capitalize" },

  total: { backgroundColor: Colors.prive.fonce, padding: Espacements.lg },
  totalLabel: { color: Colors.prive.surligne },
  totalChiffre: {
    fontFamily: Polices.titre,
    fontSize: 40,
    lineHeight: 45,
    letterSpacing: -1.4,
    color: Colors.neutre.blanc,
    marginTop: 4,
  },
  jauge: {
    height: 7,
    borderRadius: Rayons.rond,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: Espacements.md,
    overflow: "hidden",
  },
  jaugeRemplie: { height: 7, borderRadius: Rayons.rond },
  totalDetail: { color: Colors.prive.surligne, marginTop: Espacements.sm },

  form: { padding: Espacements.lg },
  espace: { marginTop: Espacements.md },
  label: { marginBottom: 9, color: Colors.neutre.encre },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Espacements.sm },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Espacements.sm,
    marginTop: Espacements.lg,
  },

  categorie: { paddingVertical: Espacements.sm + 4 },
  trait: { borderBottomWidth: 1, borderBottomColor: Colors.neutre.traitDoux },
  categorieHaut: { flexDirection: "row", alignItems: "baseline", gap: Espacements.sm },
  montantCat: {
    fontFamily: Polices.corpsGras,
    fontSize: 15,
    color: Colors.neutre.encre,
  },
  depasse: { color: Colors.etat.erreur },
  barre: {
    height: 6,
    borderRadius: Rayons.rond,
    backgroundColor: Colors.neutre.creux,
    marginTop: 8,
    overflow: "hidden",
  },
  barreRemplie: { height: 6, borderRadius: Rayons.rond },
  categorieDetail: { marginTop: 6 },

  depense: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espacements.md - 2,
    paddingVertical: Espacements.sm + 4,
  },
  jour: {
    width: 54,
    fontFamily: Polices.corpsFort,
    fontSize: 12.5,
    color: Colors.neutre.discret,
  },
  montantLigne: {
    fontFamily: Polices.titre,
    fontSize: 17,
    letterSpacing: -0.4,
    color: Colors.neutre.encre,
  },
  rentree: { color: Colors.etat.succes },
  astuce: { textAlign: "center" },
});
