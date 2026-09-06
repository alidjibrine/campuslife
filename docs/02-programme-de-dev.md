# CampusLife - programme de developpement

> **Mise a jour du 6 septembre 2026.** La base de donnees existe depuis juin
> (voir `03-base-existante.md`) : 16 tables, 52 politiques d'acces. Les durees
> ci-dessous en tiennent compte, il ne reste que les ecrans a construire sur
> plusieurs lots.

Huit lots, dans cet ordre. Un lot = une branche = un commit pousse.
On ne commence pas un lot tant que le precedent n'est pas fini.
Les durees sont des soirees de 2 a 3 heures, ce sont des ordres de grandeur.

---

## Lot 0 - Mise en place (1 soiree)

**But :** que le projet s'affiche sur ton iPhone. Rien d'autre.

- [x] Squelette Expo cree, versions alignees sur Najda
- [x] Projet Supabase `campuslife` reveille et migration 003 appliquee
- [x] Fichier `.env` rempli avec l'URL et la cle du projet
- [x] Depot git initialise, 19 fichiers prets a commiter
- [x] `npm install` et montee du projet en SDK 57 (`npx expo install --fix`)
- [x] Compte Expo `alidjibrine` connecte cote terminal et cote Expo Go
- [x] L'ecran provisoire s'affiche sur l'iPhone
- [x] Premier commit `e5c1a77` (23 fichiers) pousse sur github.com/alidjibrine/campuslife

```
cd C:\Users\adoum\Dev\campuslife
npm install
npx expo start
```

**Fini quand :** l'ecran CampusLife s'affiche sur le telephone et le premier
commit est pousse.

> **6 septembre 2026, 14 h.** L'app tourne sur l'iPhone. Deux surprises au
> passage : le projet etait ne en SDK 54 alors qu'Expo Go est passe en 57, et
> le SDK 57 impose desormais d'etre connecte au meme compte Expo des deux cotes.
> Les deux sont regles. **Lot 0 termine a 14 h 20, commit `e5c1a77` pousse.**

---

## Lot 1 - Compte et etablissement (1 a 2 soirees, la base est faite)

**But :** je m'inscris avec mon adresse universitaire et l'app sait dans quelle
ecole je suis.

- [x] Base prete : `profiles`, `schools`, rattachement automatique par domaine e-mail
- [x] `contexts/AuthContext.tsx`, repris de Najda
- [x] Ecran unique connexion et inscription, avec bascule entre les deux
- [x] Groupe `(app)` protege, redirection selon la session
- [x] Onboarding : prenom, nom, annee d'etude, filiere
- [x] Ecole non detectee : choix dans la liste plutot qu'un mur
      (a durcir au lot 7, ce choix manuel n'est pas verifie)

**A copier de Najda :** `contexts/AuthContext.tsx`, `lib/supabase.ts`,
la structure des ecrans `(auth)`, `app/index.tsx` (la redirection).

**Fini quand :** je cree un compte avec une adresse `@etu.unistra.fr`, je remplis
mon profil, je ferme l'app, je la rouvre et je suis toujours connecte.

---

## Lot 2 - Etudes, saisie a la main (2 a 3 soirees, les tables existent)

**But :** le coeur du produit. Mes cours, mes devoirs, mes notes.

- [x] Tables pretes depuis juin : `courses`, `assignments`, `grades`
- [x] `lib/etudes.ts` : lecture, ecriture, moyennes, formats de date
- [x] Ecran Cours : semaine type groupee par jour, ajout, suppression
- [x] Ecran Devoirs : tri par echeance, badges J-x et retard, coche "fait"
- [x] Ecran Notes : valeur, bareme, coefficient, moyenne ponderee sur 20
      et moyenne par matiere
- [x] Etat vide soigne sur chaque ecran
- [x] QG intermediaire : cours du jour, prochain devoir, trois tuiles chiffrees

**Fini quand :** j'ajoute un devoir pour vendredi, il apparait en tete de liste,
je le coche et il passe en fait.

---

## Lot 3 - Import de l'emploi du temps (2 a 3 soirees)

**But :** le differenciateur. L'app se remplit toute seule.

- [x] Tables pretes : `timetable_sources` et `timetable_events` (migration 003)
- [x] `lib/ics.ts` : lecture d'un flux iCalendar. Lignes repliees, echappements,
      heures UTC et heures locales, journees entieres, recurrences hebdomadaires
      et quotidiennes avec INTERVAL, COUNT, UNTIL et BYDAY
- [x] `lib/ics.test.ts` : 22 tests, lances par `npm run test:ics`
- [x] Ecran "Mon emploi du temps" : coller un lien, mettre a jour, supprimer
- [x] Vue semaine avec navigation vers la semaine precedente et la suivante
- [x] Le QG melange les seances importees et les cours saisis a la main
- [ ] Import d'un fichier `.ics` depuis le telephone
      (demande `npx expo install expo-document-picker`)

**A savoir :** les universites francaises publient deja leur emploi du temps sous
forme de lien d'agenda a synchroniser, depuis ADE ou Celcat. C'est ce lien que
l'etudiant colle. Aucune ecole n'a besoin de donner son accord.

**Fini quand :** je colle un lien d'emploi du temps et ma semaine s'affiche, et
recliquer sur "mettre a jour" ne cree pas de doublon.

> **6 septembre 2026.** Le lecteur iCalendar passe ses 22 tests. Choix de mise en
> oeuvre : a chaque synchronisation, les seances de la source sont supprimees puis
> reinserees en bloc. C'est plus simple qu'une reconciliation ligne a ligne, et ca
> garantit qu'un creneau annule par l'universite disparait aussi de l'app.
> Reste a tester avec un vrai lien d'emploi du temps.

---

## Lot 4 - Mon QG (2 soirees)

**But :** l'ecran qu'on ouvre le matin.

- [x] L'ecran provisoire est remplace par le vrai accueil
- [x] Bloc "aujourd'hui" : le programme du jour, seances importees et cours
      saisis melanges, avec le prochain creneau mis en avant
- [x] Bloc "a rendre" : les trois devoirs les plus proches, avec J-x et retard
- [x] Bloc "ma moyenne" : moyenne generale et derniere note
- [x] Navigation par onglets : QG, Etudes, Communaute, Profil
- [x] Onglet Communaute qui annonce le lot 5 au lieu de ne rien faire
- [x] Onglet Profil : identite, etablissement, modification, deconnexion

**A copier de Najda :** la structure de l'accueil et des onglets.

**Fini quand :** j'ouvre l'app et je sais quoi faire de ma journee sans cliquer.

> **6 septembre 2026.** Ecrit et verifie au typage. Le chemin d'ecriture des
> lots 1, 2 et 3 a ete teste directement en base, sous les regles d'acces reelles
> d'un etudiant connecte : devoir, cours, note, source d'agenda, seance, profil,
> publication et signalement passent tous. Reste le test sur le telephone.

---

## Lot 5 - Communaute d'etablissement (3 a 4 soirees, les tables existent)

**But :** le social, ferme a mon ecole.

- [x] Tables et fermeture par ecole deja en place : `posts`, `comments`,
      `post_likes`, filtres sur `my_school_id()`
- [x] Migration 004 appliquee : table `reports`, et abonnements filtres par ecole
      des deux cotes (on ne suit qu'un membre de sa propre ecole)
- [x] Fil de l'etablissement : quatre categories, publication, j'aime,
      rafraichissement par glissement, suppression de mes propres publications
- [x] Ecran d'un sujet : reponses en ordre chronologique, zone de reponse
- [x] Annuaire des membres de l'ecole, avec recherche, suivre et ne plus suivre
- [x] Signaler une publication ou une reponse, cinq motifs, un seul signalement
      par contenu et par personne
- [ ] Page des regles de la communaute, ecrite avant la mise en ligne (lot 7)

**Verification obligatoire :** creer deux comptes de deux ecoles differentes et
confirmer que l'un ne voit rien de l'autre. Aucun raccourci sur ce test.

> **6 septembre 2026, test passe.** Realise directement en base, avec deux vrais
> comptes dans deux ecoles differentes, sous les regles d'acces reelles :
> l'etudiant de Strasbourg voit les 3 publications, celui de l'autre ecole en voit
> 0 et ne voit qu'un seul membre, lui-meme, et un compte sans ecole ne voit rien.
> Transaction annulee, la base est inchangee. Reste le test a deux telephones.

**Fini quand :** deux comptes de la meme ecole se voient et discutent, deux comptes
d'ecoles differentes sont invisibles l'un pour l'autre.

---

## Lot 6 - Messages prives (1 soiree, la messagerie existe en base)

**But :** parler a une personne en particulier.

- [x] Tables `conversations` et `messages` deja en place depuis juin
- [ ] Liste des conversations, compteur de non-lus
- [ ] Ecran conversation, temps reel
- [ ] Ouverture d'une conversation depuis un profil de membre

**A copier de Najda :** les ecrans de messagerie, qui y sont complets et testes.
Le modele de donnees, lui, existe deja dans CampusLife.

**Fini quand :** deux telephones echangent un message qui arrive sans rafraichir.

---

## Lot 7 - Avant de montrer a quelqu'un (2 soirees)

**But :** ce qui separe un projet perso d'une app qu'on donne a des inconnus.

- [x] Fonction de suppression de compte deja ecrite (`delete_account`, juin 2026)
- [ ] Quota de stockage par compte, verifie avant chaque ecriture de fichier
- [ ] CGU et politique de confidentialite, ecrites et accessibles dans l'app
- [ ] Suppression de compte qui supprime vraiment les donnees
- [ ] Regles de moderation publiees
- [ ] `eas.json`, premier build, TestFlight
- [ ] Dix testeurs a l'Universite de Strasbourg

**Fini quand :** un etudiant que tu ne connais pas installe l'app et s'en sert
une semaine sans toi.

---

## Total

Environ 14 a 18 soirees pour la premiere version complete, contre 18 a 25 avant
la decouverte de la base de juin. Le lot 3 est celui qui donne le plus de valeur
par heure passee, le lot 5 reste le plus long et le plus risque.

## Regles de travail

1. Un lot a la fois, fini et commite avant le suivant.
2. Chaque lot se termine par un test sur le telephone, pas seulement par du code
   qui compile.
3. Budget, Documents et Memo n'entrent pas dans ce programme. Si l'envie revient,
   l'ecrire ici, en bas, et continuer le lot en cours.
4. Toute nouvelle table part avec ses regles d'acces dans la meme migration.
5. Les migrations appliquees ne sont jamais modifiees.

## Idees mises de cote

- Budget : depenses et plafonds (dans le diagramme d'origine)
- Documents : PDF, Word, photos (dans le diagramme d'origine)
- Memo : notes rapides (dans le diagramme d'origine)
- Notifications push, pour les devoirs a rendre et les reponses aux sujets
- Remplissage collaboratif des devoirs par la promo
