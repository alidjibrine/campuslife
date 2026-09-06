/**
 * CampusLife - Design system
 *
 * Deux couleurs portent tout le produit, reprises du diagramme de cadrage :
 *   - Bleu   : l'espace prive, ce que l'etudiant garde pour lui
 *   - Vert   : l'espace social, ce qu'il partage avec son etablissement
 *
 * Regle : le bleu et le vert ne servent JAMAIS a dire "ca a marche" ou
 * "il y a une erreur". Les couleurs d'etat sont separees, plus bas.
 */

export const Colors = {
  prive: {
    base: "#378ADD",
    fonce: "#2F7BC4",
    clair: "#E8F1FB",
  },
  social: {
    base: "#1D9E75",
    fonce: "#16855F",
    clair: "#E4F3ED",
  },
  neutre: {
    encre: "#26261F",
    texte: "#57564E",
    discret: "#8A887E",
    trait: "#E2DED2",
    fond: "#FBFAF6",
    surface: "#FFFFFF",
    blanc: "#FFFFFF",
  },
  etat: {
    succes: "#16855F",
    alerte: "#91650F",
    erreur: "#B23A3A",
  },
} as const;

export const Espacements = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Rayons = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;
