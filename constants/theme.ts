import { Platform, TextStyle, ViewStyle } from "react-native";

/**
 * CampusLife, système de design.
 *
 * Le monde de référence est le cahier d'étudiant : papier chaud, encre sombre,
 * et deux surligneurs. Le bleu nuit marque ce qui m'appartient, le vert
 * bouteille ce que je partage avec mon école, l'ambre ce qui demande une
 * attention. Rien d'autre ne prend de couleur.
 *
 * Règle qui n'a pas bougé depuis le cadrage : le bleu et le vert ne disent
 * jamais « ça a marché » ou « il y a une erreur ». Les couleurs d'état sont
 * séparées, plus bas, et elles seules parlent de succès ou d'échec.
 *
 * L'interface est claire, uniquement. Ce n'est pas un oubli : un thème sombre
 * fait à moitié est pire que pas de thème sombre. Tous les écrans lisent leurs
 * couleurs ici, sans jamais écrire un code hexadécimal en dur, donc le jour où
 * on l'ajoutera, c'est ce fichier qui changera, pas les vingt et un écrans.
 */

export const Colors = {
  /** L'espace privé : mes cours, mes notes, mon emploi du temps. */
  prive: {
    fonce: "#1E3A73",
    base: "#2F5FB5",
    clair: "#E7EDF9",
    surligne: "#C7D9F3",
  },
  /** L'espace social : le fil de mon école, l'annuaire, les messages. */
  social: {
    fonce: "#0F5C46",
    base: "#17805F",
    clair: "#E2F0EA",
    surligne: "#BEDFD0",
  },
  /** Le surligneur ambre : ce qui demande une attention, sans être une erreur. */
  accent: {
    fonce: "#8A5A0B",
    base: "#D99A2B",
    clair: "#FBF0DC",
  },
  neutre: {
    encre: "#1B1B19",
    texte: "#55534C",
    discret: "#8B8880",
    fantome: "#A9A69C",
    trait: "#E3DFD4",
    traitDoux: "#EDEAE1",
    creux: "#EFECE4",
    fond: "#F5F3EE",
    surface: "#FFFFFF",
    blanc: "#FFFFFF",
    /** Voiles blancs posés sur une surface colorée. */
    voile: "rgba(255, 255, 255, 0.16)",
    voileTexte: "rgba(255, 255, 255, 0.74)",
  },
  etat: {
    succes: "#17805F",
    succesClair: "#E2F0EA",
    alerte: "#8A5A0B",
    alerteClair: "#FBF0DC",
    erreur: "#A83A32",
    erreurClair: "#FAE9E7",
  },
} as const;

/**
 * Les polices. Bricolage Grotesque porte les titres, elle a du caractère et
 * ne ressemble pas à la police par défaut de tout le monde. Figtree porte
 * l'interface, elle reste lisible à 13 pixels.
 *
 * Sur React Native, une graisse ne se demande pas avec fontWeight quand on
 * utilise une police chargée : chaque graisse est une famille à part entière.
 * D'où les six noms ci-dessous plutôt qu'un seul avec des poids.
 */
export const Polices = {
  titre: "BricolageGrotesque_700Bold",
  titreMoyen: "BricolageGrotesque_600SemiBold",
  corps: "Figtree_400Regular",
  corpsMoyen: "Figtree_500Medium",
  corpsFort: "Figtree_600SemiBold",
  corpsGras: "Figtree_700Bold",
} as const;

/** Échelle typographique. Sept tailles, pas une de plus. */
export const Typo: Record<string, TextStyle> = {
  grandTitre: {
    fontFamily: Polices.titre,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.7,
    color: Colors.neutre.encre,
  },
  titre: {
    fontFamily: Polices.titre,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: Colors.neutre.encre,
  },
  sousTitre: {
    fontFamily: Polices.titreMoyen,
    fontSize: 16.5,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: Colors.neutre.encre,
  },
  corps: {
    fontFamily: Polices.corps,
    fontSize: 15.5,
    lineHeight: 23,
    color: Colors.neutre.texte,
  },
  corpsFort: {
    fontFamily: Polices.corpsFort,
    fontSize: 15.5,
    lineHeight: 23,
    color: Colors.neutre.encre,
  },
  petit: {
    fontFamily: Polices.corps,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.neutre.discret,
  },
  petitFort: {
    fontFamily: Polices.corpsFort,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.neutre.texte,
  },
  etiquette: {
    fontFamily: Polices.corpsFort,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: Colors.neutre.discret,
  },
  chiffre: {
    fontFamily: Polices.titre,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.2,
    color: Colors.neutre.encre,
  },
  bouton: {
    fontFamily: Polices.corpsFort,
    fontSize: 15.5,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
};

/** Une seule unité de base, 4, et tout en est un multiple. */
export const Espacements = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
  /** Marge latérale de tous les écrans. Une seule valeur, partout. */
  gouttiere: 20,
} as const;

export const Rayons = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  rond: 999,
} as const;

/**
 * Trois niveaux d'ombre, pas plus. Une carte ne se distingue pas du fond par
 * un trait ET une ombre : c'est l'un ou l'autre, sinon tout se ressemble.
 */
function ombre(y: number, flou: number, opacite: number, elevation: number): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: "#1B1B19",
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacite,
      shadowRadius: flou,
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;
}

export const Ombres = {
  douce: ombre(1, 3, 0.05, 1),
  moyenne: ombre(3, 10, 0.07, 3),
  forte: ombre(8, 22, 0.11, 8),
} as const;

/** Opacité appliquée à tout ce qui est pressé. Une seule valeur, partout. */
export const PRESSION = 0.62;

/** Durée de référence des animations, en millisecondes. */
export const DUREE = 180;
