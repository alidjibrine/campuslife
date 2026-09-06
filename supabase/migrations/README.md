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

## Etat au 6 septembre 2026

16 tables, 52 politiques d'acces, aucune table sans RLS.
