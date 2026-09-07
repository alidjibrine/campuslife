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
- [x] Migration 005 : cloisonnement par etablissement, suivi de lecture, realtime
- [x] Liste des conversations, compteur de non-lus (onglet Messages)
- [x] Ecran conversation, temps reel, separateurs de jour, suppression d'un message
- [x] Ouverture d'une conversation depuis l'annuaire des membres

**A copier de Najda :** les ecrans de messagerie, qui y sont complets et testes.
Le modele de donnees, lui, existe deja dans CampusLife.

**Verifie en base** (transaction annulee, trois comptes de test) : conversation
unique quel que soit l'ordre des deux membres, compteur de non lus juste des
deux cotes, un etudiant d'une autre ecole ne voit ni la conversation ni les
messages et ne peut pas en ouvrir une, les participants ne peuvent plus etre
modifies apres coup.

**Fini quand :** deux telephones echangent un message qui arrive sans rafraichir.
Reste a faire sur un vrai appareil, avec un deuxieme compte.

---

## Lot 7 - Avant de montrer a quelqu'un (2 soirees)

**But :** ce qui separe un projet perso d'une app qu'on donne a des inconnus.

- [x] Fonction de suppression de compte deja ecrite (`delete_account`, juin 2026)
- [x] Quota de stockage par compte : 50 Mo, 2 Mo par avatar, 10 Mo par document,
      controle par une regle restrictive en base (migration 007)
- [x] CGU, politique de confidentialite et regles de la communaute, accessibles
      depuis l'onglet Profil (`constants/textes-legaux.ts`)
- [x] Suppression de compte qui supprime vraiment les donnees, fichiers compris
      (migrations 007 et 008, `lib/compte.ts`)
- [x] `eas.json` et identifiants d'application ecrits
- [ ] Editeur et adresse de contact a renseigner (`EDITEUR`, bandeau rouge dans
      l'app tant que ce n'est pas fait)
- [ ] Relecture juridique des trois textes
- [ ] Premier build, distribution aux testeurs
- [ ] Dix testeurs a l'Universite de Strasbourg

**Verifie en base** (transaction annulee) : un compte cree avec des donnees dans
les dix-sept tables ne laisse aucune ligne derriere lui apres `delete_account`,
et le compte de son interlocuteur reste intact.

**Trouve au passage :** la version de la 007 effacait aussi les lignes de
`storage.objects`. Supabase l'interdit par declencheur, ce qui faisait echouer
toute la suppression. Corrige par la 008 : les fichiers sont effaces par l'app,
avant l'appel a la fonction.

La marche a suivre complete est dans `docs/04-mise-en-service.md`.

### Ajoute en cours de route

- [x] Accents remis dans toute l'interface. L'app etait ecrite sans accents,
      heritage des premiers ecrans, ce qui jurait avec les textes legaux.
      133 fragments remplaces, verifies un par un, aucun identifiant touche.
- [x] Ecran de moderation (migration 010) : role `moderateur` en base, protege
      par un declencheur pour qu'un membre ne se nomme pas lui-meme, liste des
      signalements de son etablissement avec le contenu vise, retrait du
      contenu ou classement sans suite. Un contenu signale dix fois se classe
      d'un coup.

**Verifie en base** (transaction annulee, trois comptes) : un membre simple ne
peut ni lire la liste ni se donner le role, un moderateur d'une autre ecole voit
zero signalement, le retrait efface la publication avec ses reponses et ses
mentions j'aime.

## Lot 8 - Refonte de l'interface (1 soiree)

**But :** que l'app ait l'air d'un produit, pas d'un prototype qui marche.

- [x] Systeme de design complet : palette papier, encre, deux surligneurs,
      echelle typographique de dix styles, espacements sur une base de 4,
      trois niveaux d'ombre (`constants/theme.ts`)
- [x] Deux polices chargees au demarrage : Bricolage Grotesque pour les
      titres, Figtree pour l'interface, avec repli sur la police systeme si
      le chargement echoue
- [x] Treize composants reutilisables dans `components/`
- [x] Les vingt et un ecrans refaits, sans changer une ligne de logique
- [x] Barre d'onglets dont la couleur active change entre le prive et le
      social, avec pastille de messages non lus en direct
- [x] Regles ecrites dans `docs/05-design.md` et rappelees dans `CLAUDE.md`

**Ce qui a change dans l'usage, pas seulement a l'oeil :**

- Le QG dessine la journee comme une frise verticale : ce qui est passe
  s'efface, le prochain cours est marque, et une carte en tete donne l'heure
  et le delai. On sait ou on en est sans lire.
- Les chargements montrent des cartes fantomes plutot qu'un rond qui tourne.
- Chaque etat vide propose une action. Avant, plusieurs etaient des
  culs-de-sac.
- La barre d'onglets porte le nombre de messages non lus, mis a jour en
  direct par le canal Supabase.

**Fini quand :** deux ecrans pris au hasard se ressemblent sans qu'on ait eu
a y penser. C'est le cas : la gouttiere, l'en-tete, les cartes et les boutons
viennent tous du meme endroit.

---

### Photo de profil (ajoutee au lot 8)

- [x] Depot depuis l'onglet Profil : galerie, recadrage carre, reduction a
      512 pixels et compression avant envoi
- [x] Verification du quota avant ecriture, premier vrai usage du garde-fou
      pose au lot 7
- [x] Decodage base64 vers octets ecrit a la main (`lib/base64.ts`), parce que
      `atob` n'est pas fiable selon les moteurs et que `Buffer` n'existe pas.
      14 tests.
- [x] La photo apparait partout : QG, profil, annuaire, fil, sujet, liste des
      messages, en-tete de conversation (migration 012 pour cette derniere)
- [x] Retrait de la photo, et effacement avec le compte
- [x] Politique de confidentialite mise a jour : la photo est mentionnee, et
      le fait que son adresse est publique aussi

**Bonne surprise :** le chemin choisi, `identifiant du compte / avatar.jpg`,
est exactement celui de l'application de juin 2026. La photo deja deposee a
l'epoque reapparait sans rien faire.

---

### Icone et ecran de demarrage (ajoutes au lot 8)

- [x] Icone d'application : une page de notes, quatre lignes dont deux
      surlignees en bleu et vert. Verifiee a 120 pixels avant d'etre retenue.
- [x] Icone adaptative Android, reduite pour tenir dans le cercle de securite
- [x] Ecran de demarrage : la marque sur fond papier, au lieu du fond nu
- [x] Favicon web
- [x] `app.json` complete et validee par `npx expo config`

Apple refuse une soumission sans icone : c'etait, sans qu'on l'ait note, un
bloquant du premier build.

---

### Verification de bout en bout, 7 septembre 2026

Deux passes, l'une sur le contrat entre le code et la base, l'autre sur les
operations elles-memes.

**1. Le contrat.** Extraction automatique de chaque table, chaque colonne,
chaque fonction et chaque parametre utilises par le code, puis comparaison avec
le schema reel. Resultat : **aucune colonne manquante**, les dix fonctions
existent avec la bonne signature et sont executables par un compte connecte, et
les noms de colonnes renvoyes par `mes_conversations` et
`signalements_a_traiter` correspondent exactement a ce que le code relit.
Verification aussi qu'il n'existe qu'une seule cle etrangere entre `posts` et
`comments`, et entre `posts` et `post_likes` : deux auraient rendu ambigus les
compteurs du fil et fait echouer la requete.

**2. Les operations.** Vingt-huit verifications enchainees dans une transaction
annulee, avec deux comptes de test sous les vraies regles d'acces : profil,
devoirs, cours, notes, emploi du temps importe, publication, mention j'aime,
reponse, annuaire, abonnement, signalement, conversation, message, compteur de
non lus, marquage lu, suppression d'un message, stockage, rattachement,
moderation et retrait d'un contenu signale.

**Resultat : 0 echec sur 28.** Le back end fait ce que le front lui demande.

### Mot de passe oublie (ajoute le 7 septembre 2026)

C'etait le dernier trou fonctionnel, et il etait beant : **un testeur qui
oubliait son mot de passe etait bloque a vie**, sans le moindre recours dans
l'app. Idem pour celui qui perdait son courriel de confirmation.

- [x] Ecran « je n'arrive pas a entrer » : demande du lien de reinitialisation
      et renvoi du courriel de confirmation, au meme endroit parce que c'est la
      meme detresse
- [x] Reponse identique que l'adresse existe ou non, pour ne pas reveler qui
      est inscrit
- [x] Reception du lien dans l'app : sur mobile la bibliotheque Supabase ne lit
      pas l'adresse toute seule, c'est le contexte d'authentification qui
      attrape le lien, en extrait les jetons et ouvre la session
- [x] Garde dediee : la session ouverte par un lien de reinitialisation mene au
      choix du nouveau mot de passe, avant meme l'onboarding
- [x] Messages d'erreur traduits pour les trois cas frequents : lien expire,
      trop de tentatives, mot de passe identique a l'ancien

**Reste a faire, et ca ne peut se faire que dans le tableau de bord :** declarer
les adresses de retour dans Supabase. Voir `docs/04-mise-en-service.md`.

### Finitions du meme jour

- [x] Tirer-pour-rafraichir sur les quatre ecrans qui n'en avaient pas :
      cours, devoirs, notes, emploi du temps
- [x] Migration 013 : les deux declencheurs ajoutes par les migrations 010 et
      011 etaient exposes comme points d'entree de l'API, comme l'avaient ete
      les autres avant la 006. Le retrait se fait desormais en boucle sur
      toutes les fonctions de declencheur, pour que la prochaine soit couverte
      sans qu'on y pense. Verifie ensuite que les declencheurs fonctionnent
      toujours : creation du profil a l'inscription, rattachement par domaine,
      rattachement d'une publication a l'ecole, et les deux garde-fous du role
      et de l'etablissement. Six verifications, zero echec.

**Analyseur de securite Supabase : aucune alerte de niveau ERROR.** Les
avertissements restants concernent des fonctions volontairement appelables par
un compte connecte, chacune verifiant elle-meme qui l'appelle.

---

### Relecture complete du 6 septembre 2026

Passe sur l'ensemble du code avant de le donner a des testeurs. Ce qui a ete
trouve et corrige :

1. **Le rattachement a l'etablissement pouvait etre choisi** (migration 011).
   C'etait la faille la plus serieuse, et elle etait signalee en commentaire
   dans l'onboarding depuis le lot 1, avec la mention "a durcir avant
   l'ouverture au public". Elle ne l'avait pas ete. Quand la detection par
   domaine echouait, l'ecran proposait une liste deroulante, et cette valeur
   partait telle quelle dans `profiles.school_id`, colonne que chacun peut
   modifier sur sa propre ligne. N'importe quelle adresse permettait donc de se
   declarer a Strasbourg et d'acceder au fil, a l'annuaire et a la messagerie de
   tous ses etudiants. Toute la regle de communaute fermee tenait a ce champ.
   La liste est remplacee par une liste d'information non selectionnable et un
   bouton de nouvelle verification.
2. **Trois textes echappes a la passe d'accents** : "sans matiere", "sans
   echeance", "reconnue a ton adresse". La verification automatique les avait
   manques parce qu'elle ecartait les chaines entierement en minuscules.
3. **Une source d'agenda dont la premiere synchronisation echoue** restait dans
   la liste avec zero seance et un lien deja connu comme mauvais. Elle est
   maintenant retiree.
4. **Le QG echouait en silence** : en cas d'erreur reseau, l'ecran s'affichait
   vide sans un mot. C'est le pire retour possible pour quelqu'un qui teste.
   L'erreur est desormais affichee.

**Verifie en base** (transaction annulee) : une adresse non universitaire ne
peut se rattacher a aucun etablissement, ni par mise a jour ni par insertion
directe, un etudiant deja rattache ne peut pas changer d'ecole tout en pouvant
modifier le reste de son profil, et le rattachement fonctionne des que le
domaine est ajoute a l'etablissement.

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
