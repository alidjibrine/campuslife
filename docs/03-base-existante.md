# La base de juin 2026

Decouvert le 6 septembre 2026 : le projet Supabase `campuslife` existe depuis
le 13 juin 2026 (region eu-west-3, Paris). Il etait en veille, ce qui explique
qu'il soit passe inapercu lors du premier audit.

Il ne contient pas seulement un schema : il contient des donnees de test.
Une application CampusLife a donc bien tourne, les 13 et 14 juin. Son code
n'est nulle part sur le PC.

## Les 16 migrations de juin, dans l'ordre

| Date | Migration | Ce qu'elle apporte |
|------|-----------|--------------------|
| 13/06 | init | Le socle |
| 13/06 | harden_function_search_path | Durcissement des fonctions |
| 13/06 | reset_clean_profiles | Remise a plat des profils |
| 13/06 | profile_name_and_photo | Nom et photo |
| 13/06 | profile_add_component | Champ composante |
| 13/06 | profile_personal_fields | Telephone, ville, date de naissance, bio |
| 13/06 | modules_assignments_transactions | Devoirs et depenses |
| 13/06 | budget_thresholds_and_envelopes | Seuils d'alerte et enveloppes de budget |
| 13/06 | grades_and_courses | Notes et cours |
| 14/06 | profile_transport | Arret, ligne, temps de trajet |
| 14/06 | transport_realtime | Prochains passages en temps reel |
| 14/06 | community_posts | Publications |
| 14/06 | social_comments_messaging | Commentaires et messagerie |
| 14/06 | follows_and_public_profiles | Abonnements et profils publics |
| 14/06 | delete_account_rpc | Suppression de compte |
| 14/06 | profile_views_and_activity | Vues de profil et activite |

## Les tables

**Espace prive**

| Table | Contenu |
|-------|---------|
| `profiles` | Identite, ecole (texte libre), composante, filiere, annee, bio, budget mensuel et seuils d'alerte, arret et ligne de transport |
| `courses` | Matieres et creneaux hebdomadaires saisis a la main (jour, heure de debut, heure de fin, salle) |
| `assignments` | Devoirs : titre, matiere, echeance, fait ou non |
| `grades` | Notes : matiere, intitule, note, bareme, coefficient, date |
| `transactions` | Depenses : montant, categorie, note, date |
| `category_budgets` | Plafond mensuel par categorie |

**Espace social**

| Table | Contenu |
|-------|---------|
| `posts` | Publications, avec categorie et nom d'auteur denormalise |
| `comments` | Reponses aux publications |
| `post_likes` | J'aime |
| `follows` | Qui suit qui |
| `conversations` | Discussions a deux, avec compteurs et derniers messages |
| `messages` | Messages d'une conversation |
| `profile_views` | Qui a consulte mon profil |

**Fonctions** : `delete_account`, `handle_new_user`, `profile_activity`,
`record_profile_view`, `set_updated_at`.

**Espaces de stockage** : `avatars` et `documents`.

## Ce que la base de juin ne faisait pas

- Aucun referentiel d'ecoles : `profiles.school` etait un simple texte libre.
- La communaute etait ouverte a tous les inscrits, pas fermee par etablissement.
- Aucun import d'emploi du temps : les cours etaient saisis un par un.
- Aucun quota de stockage, alors que le bucket `documents` existait deja.

Les trois premiers points sont regles par la migration 003 du 6 septembre.
Le quota reste a faire, il est dans le lot 7.

## Ce qu'on en garde

Tout. La decision du 6 septembre est de completer cette base plutot que de la
refaire. Consequence sur le programme de dev : le lot 1 et le lot 6 sont
largement deja faits cote base, il ne reste que les ecrans.
