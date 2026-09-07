# Migrations

La base CampusLife n'a pas ete creee depuis ce depot. Elle a ete construite
directement dans Supabase les 13 et 14 juin 2026, en 16 migrations.
L'inventaire complet de cet existant est dans `docs/03-base-existante.md`.

Les migrations de ce dossier reprennent donc la numerotation la ou elle
s'est arretee, a partir de 003.

Deux migrations ecrites le 6 septembre 2026 avant d'avoir vu la base
(`001_etablissements_et_profils`, `002_etudes`) ont ete abandonnees : elles
faisaient doublon avec les tables `profiles`, `courses`, `assignments` et
`grades` deja en place. Elles sont conservees pour memoire dans
`docs/archive/`. Les cinq tables francaises creees par la 002 ont ete
supprimees de la base.

## Regles

- Une migration appliquee n'est jamais modifiee. Une correction est une
  migration suivante.
- Toute nouvelle table arrive avec ses regles d'acces dans la meme migration.
- Le nommage des tables et des colonnes est en anglais, comme depuis juin.
  L'interface, elle, reste entierement en francais.

## Les migrations de ce dossier

- `003_schools_and_timetable` : etablissements, rattachement par domaine de mail,
  cloisonnement du fil par ecole, sources et seances d'emploi du temps.
- `004_signalements_et_abonnements` : signalements, abonnements entre membres.
- `005_messages_prives` : cloisonnement des conversations par etablissement,
  suivi de lecture, unicite de la paire, realtime, fonctions `ouvrir_conversation`,
  `mes_conversations` et `marquer_lu`.
- `006_durcissement_acces` : correction de la vue `public_profiles` heritee de
  juin, qui exposait l'annuaire de tous les etablissements au role anonyme.
- `007_quota_et_suppression` : limites de taille par fichier, quota de 50 Mo par
  compte, suppression de compte etendue aux tables ajoutees depuis juin.
- `008_suppression_sans_storage` : correction de la 007, qui rendait la
  suppression de compte impossible en tentant d'effacer des lignes de
  `storage.objects`, ce que Supabase interdit.
- `009_stockage_sans_parametre` : `stockage_utilise` ne repond plus que pour
  l'appelant, `search_path` fixe sur `quota_stockage`.
- `010_moderation` : role `moderateur`, protege par declencheur, et les
  fonctions de listage et de traitement des signalements.
- `011_ecole_verrouillee` : le rattachement a un etablissement ne depend plus
  que du domaine de l'adresse, verifie en base a chaque ecriture. Corrige la
  faille de l'onboarding, qui laissait choisir son ecole dans une liste.
- `012_avatar_dans_les_conversations` : la liste des conversations renvoie la
  photo de l'interlocuteur.
- `013_declencheurs_hors_api` : retire le droit d'execution de toutes les
  fonctions de declencheur, en boucle plutot qu'une par une, pour que les
  prochaines soient couvertes sans qu'on y pense.
- `014_notifications` : table `push_tokens`, un jeton par appareil, lisible
  seulement par son proprietaire, et suppression de compte etendue.

## Etat au 6 septembre 2026

17 tables, aucune table sans RLS. Analyseur de securite Supabase : plus aucune
alerte de niveau ERROR.
