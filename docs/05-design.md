# Le systeme de design

Ecrit le 6 septembre 2026, en meme temps que la refonte de l'interface.

Ce document n'est pas une inspiration, c'est une regle. Tout ecran ajoute a
CampusLife apres cette date s'y conforme, sans quoi l'app redevient en trois
mois ce qu'elle etait avant : vingt et un ecrans qui se ressemblent vaguement.

---

## L'idee

Le monde de reference est le cahier d'etudiant. Papier chaud, encre sombre,
et des surligneurs. Rien d'autre.

- **Le bleu nuit** marque ce qui m'appartient : cours, devoirs, notes, emploi
  du temps, profil.
- **Le vert bouteille** marque ce que je partage avec mon ecole : le fil,
  l'annuaire, les messages.
- **L'ambre** marque ce qui demande une attention sans etre une erreur : un
  devoir qui arrive, le prochain cours, un quota qui se remplit.

Cette regle vient du diagramme de cadrage et n'a pas bouge. Elle s'apprend
sans explication : la couleur active de la barre d'onglets change quand on
passe du prive au social.

**Le bleu et le vert ne disent jamais « ca a marche » ou « il y a une
erreur ».** Les couleurs d'etat sont separees, dans `Colors.etat`, et elles
seules parlent de succes ou d'echec.

---

## Les couleurs

Tout est dans `constants/theme.ts`. **Aucun code hexadecimal n'est ecrit
ailleurs**, y compris dans une feuille de style d'ecran. C'est verifiable en
une commande :

```powershell
Select-String -Path app\*,components\* -Pattern "#[0-9A-Fa-f]{6}" -Recurse
```

Elle ne doit rien renvoyer.

| Role | Jeton | Valeur |
|---|---|---|
| Papier | `neutre.fond` | `#F5F3EE` |
| Surface d'une carte | `neutre.surface` | `#FFFFFF` |
| Bloc en creux | `neutre.creux` | `#EFECE4` |
| Trait | `neutre.trait` / `neutre.traitDoux` | `#E3DFD4` / `#EDEAE1` |
| Encre | `neutre.encre` | `#1B1B19` |
| Texte courant | `neutre.texte` | `#55534C` |
| Texte discret | `neutre.discret` | `#8B8880` |
| Prive | `prive.fonce` / `base` / `clair` | `#1E3A73` / `#2F5FB5` / `#E7EDF9` |
| Social | `social.fonce` / `base` / `clair` | `#0F5C46` / `#17805F` / `#E2F0EA` |
| Ambre | `accent.fonce` / `base` / `clair` | `#8A5A0B` / `#D99A2B` / `#FBF0DC` |
| Erreur | `etat.erreur` | `#A83A32` |

**L'interface est claire, uniquement.** Ce n'est pas un oubli. Un theme sombre
fait a moitie est pire que pas de theme sombre du tout, et React Native ne
recalcule pas une `StyleSheet` quand le systeme bascule. Comme tous les ecrans
lisent leurs couleurs dans les jetons, le jour ou on l'ajoutera, c'est ce
fichier qui changera, pas les vingt et un ecrans.

---

## La typographie

Deux polices, chargees depuis Google Fonts au demarrage de l'app.

- **Bricolage Grotesque** porte les titres et les chiffres. Elle a du
  caractere et ne ressemble pas a la police par defaut de tout le monde.
- **Figtree** porte l'interface. Elle reste lisible a 13 pixels, ce qui est la
  seule chose qui compte pour un texte d'aide sur un telephone.

Sur React Native, **une graisse ne se demande pas avec `fontWeight`** quand on
utilise une police chargee : chaque graisse est une famille a part entiere.
D'ou les six noms dans `Polices` plutot qu'un seul avec des poids. Ecrire
`fontWeight: "700"` sur un texte en Figtree ne fait rien sur iOS et casse le
rendu sur Android.

L'echelle tient en dix styles, dans `Typo`. On ne definit pas une taille a la
main dans un ecran : si aucun style ne convient, c'est l'echelle qu'il faut
discuter, pas l'ecran.

| Style | Usage |
|---|---|
| `grandTitre` | Le titre d'un ecran, un par ecran |
| `titre` | Un titre de bloc important |
| `sousTitre` | Le nom d'une personne, le titre d'une carte |
| `corps` | Le texte courant |
| `corpsFort` | Une ligne de liste, un intitule |
| `petit` / `petitFort` | Les details, les dates, les aides |
| `etiquette` | Les titres de rubrique. **Le seul endroit ou l'on ecrit en capitales.** |
| `chiffre` | Un nombre qui est le sujet de la carte |
| `bouton` | Le texte d'un bouton |

---

## L'espace

Une seule unite de base, 4, et tout en est un multiple. La gouttiere laterale
vaut 20 et ne change jamais d'un ecran a l'autre : c'est elle qui fait qu'on
sent que c'est la meme app.

Les groupes d'elements frere se posent avec `gap`, jamais avec des marges
individuelles qui se cumulent ou s'annulent.

---

## Les composants

Treize composants dans `components/`. **Un ecran ne redessine pas un bouton,
une carte ou un etat vide.** S'il manque quelque chose, on ajoute un composant
ou une variante, on ne bricole pas dans l'ecran.

| Composant | Ce qu'il fait |
|---|---|
| `Ecran` | Le cadre : gouttiere, attente, erreur, tirer-pour-rafraichir, barre du bas |
| `Entete` | Surtitre, grand titre, sous-titre, bouton retour rond, action |
| `Carte` | Une surface posee sur le papier. Variantes surface, creux, contour |
| `Bouton` | Variantes plein, contour, discret, danger. Tailles md et sm |
| `Champ` | Saisie avec label, aide, erreur, et bordure qui reagit au focus |
| `Puce` | Un choix parmi plusieurs sur une ligne |
| `Badge` | Une pastille de comptage ou d'etat |
| `Avatar` | La photo de profil, ou les initiales dans un rond si elle manque |
| `Ligne` | Une ligne de liste avec ses fentes gauche et droite |
| `Section` | Une etiquette de rubrique et son contenu |
| `EtatVide` | Icone, titre, explication, et une porte de sortie |
| `Alerte` | Un message en ligne : erreur, attention, succes, information |
| `Squelette` | Des cartes fantomes pendant le chargement |

---

## Les regles qui ne se discutent pas

1. **Un seul bouton plein par ecran.** C'est lui qui dit quelle est l'action
   principale. Deux actions principales sur un ecran, c'est aucune.
2. **Jamais un trait ET une ombre** sur le meme bloc. C'est l'un ou l'autre,
   sinon tout se ressemble et plus rien ne ressort.
3. **Un etat vide a toujours une porte de sortie.** Il ne dit pas « aucune
   donnee », il dit ce qui manque et ce qu'on peut faire. Un etat vide sans
   bouton est un cul-de-sac.
4. **Le chargement montre des cartes fantomes**, pas un rond qui tourne au
   milieu du vide. On voit tout de suite la forme de ce qui arrive.
5. **Une erreur s'affiche.** Jamais un `catch` vide. Un ecran vide sans
   explication est le pire des retours pour quelqu'un qui teste.
6. **Tout ce qui se touche reagit.** Opacite `PRESSION` a l'appui, `hitSlop`
   sur les petites cibles, `accessibilityLabel` sur les boutons sans texte.
7. **Les capitales sont reservees aux etiquettes de rubrique.** Un titre en
   capitales crie.
8. **Les accents sont obligatoires.** L'app a ete ecrite sans pendant trois
   mois et il a fallu 133 remplacements verifies un par un pour reparer ca.

---

## La photo de profil

Elle se depose depuis l'onglet Profil : on touche la pastille appareil photo,
on choisit une image, on la recadre en carre. L'app la reduit a 512 pixels de
cote et la compresse avant l'envoi, parce qu'une photo de telephone pese quatre
megaoctets et que le seau en refuse deux.

Le chemin est toujours `identifiant du compte / avatar.jpg`, seul chemin que
les regles d'acces du stockage autorisent, et le meme que celui de juin 2026 :
les photos deposees a l'epoque reapparaissent telles quelles.

Le composant `Avatar` prend une `url` et un `nom`. Sans url, ou si l'image ne
charge pas, il retombe sur les initiales dans un rond dont la teinte derive du
nom. **Un ecran n'affiche jamais une photo autrement qu'avec ce composant** :
c'est ce qui garantit qu'un profil sans photo ne laisse jamais un carre vide.

Le seau des avatars est public. L'adresse contient un identifiant aleatoire et
ne se devine pas, mais elle se partage. C'est ecrit dans la politique de
confidentialite.

## Ce qui reste a faire cote design

- Une icone d'application et un ecran de demarrage dessines. Aujourd'hui
  c'est le fond papier et rien d'autre.
- Le theme sombre, quand il y aura des testeurs pour le reclamer.
- Les transitions entre ecrans, laissees a leur valeur par defaut.
