# CampusLife - modele de donnees

Etat au 6 septembre 2026 : **16 tables, 52 politiques d'acces, aucune table
sans RLS**. La base vient de juin 2026 (voir `03-base-existante.md`), completee
le 6 septembre par la migration 003.

## Les trois regles

1. Tout ce qui est prive est filtre sur `user_id = auth.uid()`.
2. Tout ce qui est social est filtre sur l'ecole du lecteur, via la fonction
   `my_school_id()`.
3. Aucune table n'est creee sans ses politiques dans la meme migration.

## Espace prive

| Table | Role |
|-------|------|
| `profiles` | Le compte, son ecole (`school_id`), sa filiere, son budget, son transport |
| `courses` | Matieres et creneaux hebdomadaires saisis a la main |
| `assignments` | Devoirs, avec echeance et statut |
| `grades` | Notes, avec bareme et coefficient |
| `timetable_sources` | Le lien d'agenda ou le fichier importe |
| `timetable_events` | Les seances datees, issues de l'import ou saisies |
| `transactions`, `category_budgets` | Le module Budget, hors perimetre v1 |

Anti-doublon a l'import : la cle unique `(user_id, external_uid)` sur
`timetable_events`. Reimporter le meme agenda met a jour, ne duplique pas.

## Espace social, ferme par ecole

| Table | Role |
|-------|------|
| `schools` | Le referentiel des etablissements, avec leurs domaines e-mail |
| `posts` | Publications, portant `school_id` |
| `comments`, `post_likes` | Suivent l'ecole de la publication parente |
| `follows` | Abonnements. **Pas encore filtre par ecole, a faire au lot 5** |
| `conversations`, `messages` | Messagerie a deux, deja complete |
| `profile_views` | Qui a consulte mon profil |

## Le rattachement a l'ecole

A la creation du profil, le declencheur `attach_school_from_email` lit le
domaine de l'adresse e-mail et cherche l'ecole correspondante dans `schools`.
Un etudiant dont l'ecole n'est pas au referentiel a `school_id` a null : il ne
voit aucune publication, ce qui est le comportement attendu. L'ecran
"ton ecole n'est pas encore la" est a faire au lot 1.

La fonction `my_school_id()` est en `security definer` : sans elle, une
politique posee sur `profiles` qui interroge `profiles` part en recursion
infinie. Toute nouvelle politique sociale doit passer par cette fonction.

## Ce qui reste a modeliser

- Signalements et moderation (lot 5)
- Filtrage de `follows` par ecole (lot 5)
- Quota de stockage : le champ existe cote code mais rien ne le verifie (lot 7)
