@AGENTS.md

# CampusLife - consignes de travail

## Contexte d'Ali

Windows + iPhone 17 Pro Max, teste avec Expo Go, editeur VS Code.
Il code le soir, par sessions courtes. Il n'est pas developpeur de metier :
expliquer simplement, aller au concret, montrer le resultat a l'ecran.

## Toujours rappeler les commandes a executer

A la fin de chaque changement de code (modification de fichier, ajout de package,
refonte d'ecran), toujours lister les commandes exactes a taper dans le terminal,
dans un bloc a part, avant le debrief :

> **A executer dans ton terminal :**
>
> ```
> npx expo start --clear
> ```
> Puis presse `r` pour reload sur ton iPhone.

Inclure systematiquement :
- la commande d'install si un package a ete ajoute (`npx expo install <pkg>`)
- la commande pour relancer Metro
- l'instruction pour reload Expo Go (`r` dans le terminal, ou secousse iPhone)
- la commande git pour sauvegarder (`git add . && git commit -m "..." && git push`)

## Regles du projet

1. **Un lot a la fois.** Le programme est dans `docs/02-programme-de-dev.md`.
   Ne pas commencer un lot avant que le precedent soit termine et commite.
0. **La base existe deja.** Lire `docs/03-base-existante.md` avant de toucher
   au schema. 16 tables sont en place depuis juin 2026, on les complete, on ne
   les refait pas.
2. **Perimetre v1 ferme.** Budget, Documents et Memo attendent. Si l'envie revient,
   l'ecrire dans le programme, pas dans le code.
3. **Deux couleurs, deux sens.** Le bleu, c'est le prive. Le vert, c'est le social.
   Ces deux couleurs ne servent jamais a dire "reussi" ou "erreur", il y a
   `Colors.etat` pour ca.
4. **RLS d'abord.** Toute nouvelle table part avec ses regles d'acces dans la meme
   migration. Aucune table sans politique.
5. **Migrations numerotees**, jamais modifiees apres avoir ete appliquees.
   Une correction est une nouvelle migration.
6. **Quota de stockage.** L'app est gratuite : toute fonctionnalite qui stocke un
   fichier verifie le quota du compte avant d'ecrire.
7. **Deux langues, une regle.** L'interface, les commentaires et les messages
   d'erreur sont en francais. Les tables et les colonnes restent en anglais,
   comme depuis juin 2026. On ne renomme pas l'existant.
8. **Pas de tirets cadratins** dans les textes affiches ou ecrits.

## Taches

Tenir la liste de taches a jour au fur et a mesure. Ali aime suivre la progression.

## Interface

Le systeme de design est dans `docs/05-design.md` et `constants/theme.ts`.
Il se lit avant d'ecrire un ecran, pas apres.

- Aucun code hexadecimal hors de `constants/theme.ts`. Aucune taille de texte
  hors de `Typo`. Aucun espacement hors de `Espacements`.
- Un ecran n'invente pas un bouton, une carte ou un etat vide : il utilise
  les composants de `components/`. S'il en manque un, on l'ajoute la, pas
  dans l'ecran.
- Un seul bouton plein par ecran. Un etat vide a toujours une porte de sortie.
  Une erreur s'affiche toujours, jamais de `catch` vide.
- Les textes affiches sont accentues. Sans exception.
