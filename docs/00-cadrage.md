# CampusLife - cadrage

Origine : diagramme du 16 juin 2026 (`campuslife_workflow_etudiant.svg`).
Decisions arretees le 6 septembre 2026.

## L'idee

Un etudiant, deux espaces. Un espace prive qu'il garde pour lui, un espace social
partage avec son etablissement. Un seul profil sert de pivot entre les deux :
"je regle et je garde" d'un cote, "je publie et je partage" de l'autre.

## Les six decisions

| # | Question | Reponse |
|---|----------|---------|
| 1 | Quel etudiant ? | Tous les etudiants de France |
| 2 | Quel module est le produit ? | Etudes (devoirs, notes, cours) |
| 3 | Le social, quand ? | Des le depart |
| 4 | Communaute ouverte ou fermee ? | Fermee par etablissement |
| 5 | Comment se remplit Etudes ? | Saisie a la main + import d'un emploi du temps (fichier ou lien) |
| 6 | Qui paie ? | Personne pour l'instant, l'app est gratuite |

## Perimetre de la premiere version

Dedans : connexion, mon QG, Etudes, import d'emploi du temps, communaute
d'etablissement, sujets, membres, messages prives, mon profil.

Dehors : Budget, Documents, Memo. Ils sont dans le diagramme d'origine et
reviendront apres le lot 7.

## Ce que les decisions impliquent

- **Referentiel d'etablissements des la v1.** La communaute etant fermee par ecole,
  il faut savoir a quelle ecole rattacher chaque inscrit. Rattachement par le domaine
  de l'adresse e-mail.
- **Lancement ecole par ecole.** Le social des le depart veut dire que chaque
  etablissement demarre vide. On ouvre Strasbourg d'abord, on en ajoute un quand
  le premier vit.
- **Quota de stockage obligatoire.** L'app est gratuite, donc chaque compte a une
  limite, definie avant la premiere fonctionnalite qui stocke un fichier.
- **Regle de moderation ecrite avant le premier sujet publie.** Pas apres le premier
  probleme.

## Le levier

Environ la moitie du socle technique existe deja dans le projet Najda
(`C:\Users\adoum\Dev\najda`) : authentification Supabase, profil et onboarding, messagerie
temps reel, upload de fichiers, theme clair et sombre, composants d'interface.
A ecrire vraiment : Etudes, l'import d'emploi du temps, les Sujets, les Membres.
