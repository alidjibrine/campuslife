# CampusLife

Application mobile pour les etudiants en France.
L'agenda d'etudes, plus la communaute de son etablissement.

## Etat

Projet cadre le 6 septembre 2026, developpement au lot 0.
Le squelette Expo tourne, il n'y a pas encore d'ecran fonctionnel.

**La base de donnees, elle, existe depuis juin 2026** : 16 tables, 52 politiques
d'acces, deux espaces de stockage, des donnees de test. Lire
`docs/03-base-existante.md` avant de toucher au schema.

## Demarrer

```bash
cd C:\Users\adoum\Dev\campuslife
npm install
npx expo start
```

Puis scanne le QR code avec Expo Go sur l'iPhone.
Pour vider le cache quand quelque chose ne se met pas a jour : `npx expo start --clear`.

Avant le lot 1, copier `.env.example` en `.env` et remplir les deux valeurs Supabase.

## Verifier

```bash
npm run typecheck    # aucune erreur de typage sur tout le projet
npm run test:ics     # 22 tests du lecteur d'emploi du temps
```

## Structure

```
app/          ecrans (expo-router, routage par fichiers)
lib/          clients et acces aux donnees (supabase, api)
constants/    theme, couleurs, espacements
docs/         cadrage, modele de donnees, programme de dev
supabase/     migrations SQL, dans l'ordre
```

## Documents de reference

- `docs/00-cadrage.md` : les six decisions et le perimetre de la v1
- `docs/01-modele-de-donnees.md` : les tables et les regles d'acces
- `docs/02-programme-de-dev.md` : les huit lots, dans l'ordre
- `docs/03-base-existante.md` : l'inventaire de la base construite en juin 2026
- `docs/campuslife_workflow_etudiant.svg` : le diagramme d'origine du 16 juin 2026
- `supabase/migrations/README.md` : pourquoi les migrations commencent a 003

## Regle de perimetre

Budget, Documents et Memo ne font pas partie de la v1. Ils sont dans le diagramme
d'origine, ils reviendront plus tard. Ne pas les commencer avant que le lot 7 soit fini.
