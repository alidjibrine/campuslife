# Mise en service

Ce qu'il reste a faire, dans l'ordre, pour qu'un etudiant que tu ne connais pas
puisse installer CampusLife et s'en servir.

---

## 1. Completer l'identite de l'editeur

Fichier : `constants/textes-legaux.ts`, objet `EDITEUR` en haut.

Quatre champs valent `A_COMPLETER` : nom, statut, adresse, courriel. Tant qu'ils
ne sont pas remplis, l'app affiche un bandeau rouge en haut des trois documents.
C'est volontaire, pour que ce soit impossible a oublier.

Le statut, c'est ce que tu declares etre : personne physique, association,
micro-entreprise. Pour une phase de test avec dix camarades, une personne
physique suffit. Le courriel doit etre une adresse que tu releves, parce que
c'est celle par laquelle on t'ecrira pour exercer un droit RGPD ou contester une
moderation, et tu as un mois pour repondre.

Une adresse dediee du type `campuslife.contact@...` evite d'exposer ton adresse
personnelle dans un document public.

---

## 2. Faire relire les trois textes

`constants/textes-legaux.ts` contient les conditions d'utilisation, la politique
de confidentialite et les regles de la communaute. Ils sont serieux et couvrent
ce qu'il faut couvrir, mais ils n'ont pas ete ecrits par un juriste.

L'app traite des notes, un emploi du temps et des messages prives d'etudiants.
Avant de depasser le cercle des testeurs volontaires et prevenus, fais-les relire
par quelqu'un dont c'est le metier. Beaucoup d'universites ont un service
juridique, et le delegue a la protection des donnees de l'Universite de
Strasbourg est joignable.

---

## 3. Verifier ce que la base laisse passer

Deux commandes a relancer apres chaque migration :

- l'analyseur de securite Supabase, onglet Advisors du tableau de bord, ou par
  l'assistant. Aucune alerte de niveau ERROR ne doit subsister.
- le test de suppression de compte, decrit dans `docs/02-programme-de-dev.md`.

La cle publique de l'application est embarquee dans le paquet installe sur les
telephones. Elle est donc lisible par n'importe qui. C'est normal et prevu : la
protection ne vient pas du secret de la cle mais des regles d'acces de la base.
C'est pour cette raison qu'une vue mal configuree, comme `public_profiles` avant
la migration 006, suffit a tout ouvrir.

---

## 3 bis. Declarer les adresses de retour dans Supabase

**Sans cette etape, le lien « mot de passe oublie » ouvre une page d'erreur au
lieu de l'application.** C'est la seule chose qui reste a faire cote base, et
elle ne se fait que dans le tableau de bord.

Tableau de bord Supabase, projet `campuslife`, Authentication, puis URL
Configuration. Dans **Redirect URLs**, ajouter ces deux lignes :

```
campuslife://**
exp://**
```

La premiere sert a l'application installee, la seconde a Expo Go pendant le
developpement. Le champ **Site URL** peut rester tel quel : sur mobile, c'est
l'adresse passee par l'app qui compte.

Deux choses a savoir sur les courriels :

- Le service de messagerie fourni par defaut avec Supabase est **limite a
  quelques envois par heure**. C'est suffisant pour dix testeurs, pas pour une
  ouverture large. Le jour ou ca coince, il faudra brancher un vrai service
  d'envoi dans Authentication, Emails.
- Les modeles de courriel sont en anglais par defaut. Ils se traduisent au meme
  endroit, onglet Templates. Ce n'est pas bloquant, mais un etudiant qui recoit
  « Reset your password » dans une app entierement en francais le remarque.

---

## 4. Le chemin gratuit : Android d'abord

Un build Android en distribution interne produit un fichier `.apk` que tu
envoies directement a tes testeurs. Pas de compte developpeur, pas de store,
pas d'attente de validation.

```powershell
npm install -g eas-cli
eas login
eas init
eas build --platform android --profile preview
```

La commande rend un lien de telechargement. Le testeur ouvre le lien sur son
telephone Android, autorise l'installation depuis une source inconnue, et
l'application est installee.

C'est de loin le moyen le plus rapide d'avoir dix personnes sur l'app.

---

## 5. Le chemin iOS : TestFlight

Il faut un compte Apple Developer payant, 99 dollars par an. Sans lui, aucune
installation possible sur un iPhone qui n'est pas le tien.

```powershell
eas build --platform ios --profile production
eas submit --platform ios
```

Avant la premiere soumission :

1. creer le compte sur developer.apple.com
2. creer l'app dans App Store Connect avec l'identifiant
   `com.alidjibrine.campuslife`, celui deja inscrit dans `app.json`
3. completer les trois champs `A_COMPLETER` de la section `submit` de `eas.json`
   (`appleId`, `ascAppId`, `appleTeamId`)

Le build met une dizaine de minutes a apparaitre dans TestFlight apres la
soumission. Tu invites ensuite les testeurs par leur adresse de messagerie, dans
l'onglet Testeurs internes.

Apple demande, avant toute diffusion meme en test externe, une adresse
d'assistance et un lien vers la politique de confidentialite. Le texte existe
dans l'app, mais il faudra aussi le publier sur une page web accessible sans
installer l'application.

---

## 6. Recruter dix testeurs

Les comptes ne sont acceptes que si l'adresse appartient a un domaine reconnu.
A ce jour, un seul etablissement est enregistre : l'Universite de Strasbourg,
domaines `etu.unistra.fr` et `unistra.fr`.

C'est desormais la seule porte d'entree : depuis la migration 011, le
rattachement ne peut plus etre choisi dans l'application, la base le refuse.
Pour ouvrir a un autre etablissement, ajouter une ligne dans `schools` :

```sql
insert into public.schools (name, short_name, city, email_domains)
values ('Universite de Lorraine', 'UL', 'Nancy',
        array['etu.univ-lorraine.fr', 'univ-lorraine.fr']);
```

Un etudiant deja inscrit avant l'ajout de son ecole n'est pas rattache
automatiquement. Il rouvre l'onboarding et appuie sur "Verifier a nouveau".

Ce qu'il faut leur dire honnetement : l'app est en test, les donnees peuvent
etre perdues, les messages prives ne sont pas chiffres de bout en bout et tu as
techniquement les moyens de les lire en tant qu'administrateur de la base.
C'est ecrit dans la politique de confidentialite, autant le dire de vive voix.

---

## 7. Ce qu'il faudra surveiller ensuite

- Le quota de stockage est de 50 Mo par compte, avec 2 Mo par avatar et 10 Mo
  par document. Ces valeurs sont dans la fonction `quota_stockage()` en base et
  dans `storage.buckets`. A revoir quand l'app permettra vraiment de deposer des
  fichiers, ce qui n'est pas encore le cas.
- Les signalements se traitent depuis l'app, onglet Profil, entree Moderation.
  Cette entree n'apparait que pour un compte dont la colonne `role` de la table
  `profiles` vaut `moderateur`. Ton compte l'est deja.

  Pour nommer quelqu'un d'autre, depuis l'editeur SQL de Supabase :

  ```sql
  update public.profiles set role = 'moderateur'
   where email = 'adresse@etu.unistra.fr';
  ```

  Cette commande ne fonctionne que depuis le tableau de bord. Un declencheur
  interdit toute modification du role depuis l'application, sans quoi n'importe
  quel membre pourrait se nommer moderateur en modifiant son profil.

- Un moderateur ne voit que les signalements de son propre etablissement, et ne
  peut retirer que des contenus de son etablissement.
