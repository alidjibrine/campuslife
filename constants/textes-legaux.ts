/**
 * Les trois textes que l'app doit publier avant d'accueillir des inconnus :
 * conditions d'utilisation, politique de confidentialite, regles de la
 * communaute.
 *
 * Ils sont ranges ici en donnees plutot qu'en trois ecrans presque identiques.
 * Un seul ecran, app/(app)/document/[nom].tsx, sait les afficher.
 *
 * Attention : ces textes sont une base de travail solide, pas un avis
 * juridique. Ils traitent des donnees d'etudiants, dont des notes et un emploi
 * du temps. Avant une diffusion large, ils doivent etre relus par quelqu'un
 * dont c'est le metier.
 */

/** Identite de l'editeur. Tant que ces champs valent A_COMPLETER, l'app
 *  affiche un avertissement en haut des documents. */
export const EDITEUR = {
  nom: "A_COMPLETER",
  statut: "A_COMPLETER",
  adresse: "A_COMPLETER",
  courriel: "A_COMPLETER",
  hebergeur: "Supabase, infrastructure Amazon Web Services, region Europe (Paris)",
};

export const A_COMPLETER = "A_COMPLETER";

export const EDITEUR_INCOMPLET = [
  EDITEUR.nom,
  EDITEUR.statut,
  EDITEUR.adresse,
  EDITEUR.courriel,
].some((v) => v === A_COMPLETER);

export type Section = { titre: string; paragraphes: string[] };

export type DocumentLegal = {
  cle: string;
  titre: string;
  sousTitre: string;
  miseAJour: string;
  sections: Section[];
};

const MAJ = "6 septembre 2026";

const cgu: DocumentLegal = {
  cle: "cgu",
  titre: "Conditions d'utilisation",
  sousTitre: "Ce à quoi vous vous engagez en utilisant CampusLife",
  miseAJour: MAJ,
  sections: [
    {
      titre: "1. Objet",
      paragraphes: [
        "Les présentes conditions régissent l'accès à l'application CampusLife et son utilisation. Le fait de créer un compte vaut acceptation sans réserve de ces conditions.",
        "CampusLife est un service d'organisation des études et d'entraide entre étudiants d'un même établissement. Il comprend un espace privé, où l'utilisateur gère ses cours, ses devoirs, ses notes et son emploi du temps, et un espace communautaire, réservé aux membres de son établissement.",
      ],
    },
    {
      titre: "2. Éditeur",
      paragraphes: [
        "L'application est éditée par " + EDITEUR.nom + ", " + EDITEUR.statut + ", dont l'adresse est " + EDITEUR.adresse + ".",
        "Contact : " + EDITEUR.courriel + ".",
        "Hébergement : " + EDITEUR.hebergeur + ".",
      ],
    },
    {
      titre: "3. Conditions d'accès",
      paragraphes: [
        "L'inscription est réservée aux personnes justifiant d'une adresse de messagerie délivrée par un établissement d'enseignement supérieur reconnu par le service. Le rattachement à un établissement est déterminé automatiquement à partir du domaine de cette adresse.",
        "L'accès est réservé aux personnes âgées de quinze ans révolus. En deçà, l'inscription requiert l'autorisation du titulaire de l'autorité parentale.",
        "L'utilisateur ne peut détenir qu'un seul compte. Il s'engage à fournir des informations exactes et à les tenir à jour.",
      ],
    },
    {
      titre: "4. Sécurité du compte",
      paragraphes: [
        "L'utilisateur est responsable de la confidentialité de son mot de passe et de toute activité effectuée depuis son compte. Il informe l'éditeur sans délai de tout usage non autorisé dont il aurait connaissance.",
      ],
    },
    {
      titre: "5. Contenus publiés",
      paragraphes: [
        "L'utilisateur demeure titulaire des droits sur les contenus qu'il publie. Il concède à l'éditeur, pour la seule durée nécessaire au fonctionnement du service, le droit d'héberger et d'afficher ces contenus auprès des membres de son établissement.",
        "L'utilisateur garantit disposer des droits sur ce qu'il publie et s'engage à ne pas diffuser de contenu protégé sans autorisation, notamment des supports de cours, sujets ou corrigés dont la diffusion serait interdite par l'établissement.",
      ],
    },
    {
      titre: "6. Comportements interdits",
      paragraphes: [
        "Sont notamment interdits : le harcèlement et les propos injurieux ou discriminatoires ; les contenus à caractère sexuel ; l'incitation à la haine ou à la violence ; la publicité et le démarchage ; la diffusion de données personnelles de tiers ; l'usurpation d'identité ; la diffusion de sujets d'examen obtenus frauduleusement ; et plus généralement tout contenu contraire à la loi.",
        "Les règles détaillées figurent dans le document Règles de la communauté, qui fait partie intégrante des présentes conditions.",
      ],
    },
    {
      titre: "7. Emplois du temps importés",
      paragraphes: [
        "L'utilisateur peut relier un lien d'abonnement à son emploi du temps universitaire. Il garantit être autorisé à en faire usage. Les séances importées relèvent de son espace privé et ne sont visibles d'aucun autre membre.",
      ],
    },
    {
      titre: "8. Modération",
      paragraphes: [
        "L'éditeur peut retirer tout contenu signalé qui contreviendrait aux présentes conditions, et suspendre ou fermer le compte de son auteur. En cas de manquement grave, notamment lorsque la sécurité d'une personne est en jeu, la fermeture peut intervenir sans avertissement préalable.",
        "L'utilisateur dont un contenu a été retiré ou dont le compte a été suspendu peut contester la mesure à l'adresse indiquée à l'article 2.",
      ],
    },
    {
      titre: "9. Disponibilité et responsabilité",
      paragraphes: [
        "Le service est fourni en l'état. Il se trouve en phase de test et peut connaître des interruptions, des pertes de données ou des évolutions de fonctionnalités sans préavis.",
        "L'éditeur ne saurait être tenu responsable des conséquences d'une indisponibilité, ni de l'exactitude des informations publiées par les utilisateurs. Il est recommandé de ne pas faire de CampusLife l'unique support de ses données scolaires.",
      ],
    },
    {
      titre: "10. Gratuité",
      paragraphes: [
        "Le service est gratuit. Aucune publicité n'y est diffusée et aucune donnée n'est cédée à des tiers à des fins commerciales. L'éditeur se réserve la faculté d'introduire à l'avenir des fonctionnalités payantes, qui seraient alors clairement identifiées comme telles.",
      ],
    },
    {
      titre: "11. Durée et résiliation",
      paragraphes: [
        "L'utilisateur peut supprimer son compte à tout moment depuis l'onglet Profil. La suppression est immédiate et définitive dans les conditions décrites par la politique de confidentialité.",
      ],
    },
    {
      titre: "12. Modification des conditions",
      paragraphes: [
        "Les présentes conditions peuvent être modifiées. Toute modification substantielle est portée à la connaissance des utilisateurs dans l'application. La poursuite de l'utilisation après cette information vaut acceptation.",
      ],
    },
    {
      titre: "13. Droit applicable",
      paragraphes: [
        "Les présentes conditions sont régies par le droit français. En cas de différend, une solution amiable sera recherchée avant toute action contentieuse.",
      ],
    },
  ],
};

const confidentialite: DocumentLegal = {
  cle: "confidentialite",
  titre: "Politique de confidentialité",
  sousTitre: "Quelles données sont traitées, pourquoi, et quels sont vos droits",
  miseAJour: MAJ,
  sections: [
    {
      titre: "1. Responsable du traitement",
      paragraphes: [
        "Le responsable du traitement est " + EDITEUR.nom + ", " + EDITEUR.statut + ", " + EDITEUR.adresse + ". Toute demande relative aux données personnelles peut être adressée à " + EDITEUR.courriel + ".",
      ],
    },
    {
      titre: "2. Données traitées",
      paragraphes: [
        "Données de compte : adresse de messagerie et mot de passe, ce dernier n'étant conservé que sous forme chiffrée et n'étant accessible à personne.",
        "Données de profil : prénom, nom, année d'études, filière, établissement de rattachement, et la photo de profil si vous en déposez une.",
        "Données scolaires privées : cours, devoirs, notes, sources et séances d'emploi du temps.",
        "Contenus communautaires : publications, commentaires, mentions j'aime, abonnements, signalements.",
        "Messages privés : contenu des messages échangés avec un autre membre.",
        "Données techniques : horodatages de création et de connexion, journaux de sécurité de l'hébergeur.",
      ],
    },
    {
      titre: "3. Finalités et bases légales",
      paragraphes: [
        "La fourniture du service, qui comprend la tenue du compte, l'espace d'études, le fil de l'établissement et la messagerie, repose sur l'exécution du contrat que constituent les conditions d'utilisation.",
        "La sécurité du service, la prévention des abus et la modération des contenus signalés reposent sur l'intérêt légitime de l'éditeur et des utilisateurs à disposer d'un espace sûr.",
        "Aucune donnée n'est utilisée à des fins publicitaires, de profilage ou de mesure d'audience par un tiers.",
      ],
    },
    {
      titre: "4. Qui accède à quoi",
      paragraphes: [
        "Les données scolaires privées et les séances d'emploi du temps ne sont visibles d'aucun autre utilisateur. Les règles d'accès de la base de données interdisent techniquement leur lecture par un tiers.",
        "Les publications, commentaires et le profil sont visibles des seuls membres du même établissement. Un membre d'un autre établissement ne peut ni les lire ni les rechercher.",
        "Les messages privés ne sont lisibles que par les deux participants à la conversation. Ils ne sont toutefois pas chiffrés de bout en bout : l'éditeur, en sa qualité d'administrateur de la base de données, dispose de la capacité technique d'y accéder. Il s'engage à ne le faire que sur réquisition légale ou lorsque la sécurité d'une personne l'exige.",
        "La photo de profil, lorsqu'elle est déposée, est hébergée à une adresse publique. Cette adresse comporte un identifiant aléatoire et ne se devine pas, mais toute personne qui la possède peut consulter la photo sans être connectée. La suppression de la photo, depuis l'onglet Profil, retire le fichier définitivement.",
      ],
    },
    {
      titre: "5. Sous-traitants et localisation",
      paragraphes: [
        "L'hébergement de la base de données, de l'authentification et des fichiers est assuré par Supabase, sur une infrastructure Amazon Web Services située dans la région Europe (Paris). Les données ne font l'objet d'aucun transfert hors de l'Union européenne du fait du fonctionnement normal du service.",
        "Aucun autre sous-traitant n'intervient sur les données à ce jour.",
      ],
    },
    {
      titre: "6. Durées de conservation",
      paragraphes: [
        "Les données sont conservées tant que le compte existe. Elles sont supprimées lors de la suppression du compte.",
        "Les sauvegardes techniques réalisées par l'hébergeur peuvent contenir des données déjà supprimées jusqu'à leur rotation, qui intervient dans un délai de quelques jours.",
        "Les signalements sont conservés le temps de leur traitement, puis pendant une durée n'excédant pas six mois, afin de permettre le traitement des récidives.",
      ],
    },
    {
      titre: "7. Vos droits",
      paragraphes: [
        "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données. La rectification de la plupart des informations est possible directement dans l'application, depuis l'onglet Profil.",
        "Toute demande peut être adressée à " + EDITEUR.courriel + ". Il y sera répondu dans un délai d'un mois.",
        "Vous pouvez introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés, 3 place de Fontenoy, 75007 Paris, www.cnil.fr.",
      ],
    },
    {
      titre: "8. Suppression du compte",
      paragraphes: [
        "La suppression s'effectue depuis l'onglet Profil. Elle entraîne l'effacement immédiat et définitif du compte, du profil, de la photo de profil, des cours, devoirs, notes, séances d'emploi du temps, publications, commentaires, mentions j'aime, abonnements, signalements et fichiers déposés.",
        "Les conversations privées auxquelles vous participiez sont supprimées dans leur intégralité, y compris les messages de votre interlocuteur. Ce dernier n'en conserve donc aucune trace.",
        "Cette opération est irréversible et ne fait l'objet d'aucun délai de rétractation.",
      ],
    },
    {
      titre: "9. Mineurs",
      paragraphes: [
        "Le service n'est pas destiné aux personnes de moins de quinze ans. Si un compte devait avoir été créé en méconnaissance de cette règle, il sera supprimé sur simple signalement.",
      ],
    },
    {
      titre: "10. Modification",
      paragraphes: [
        "La présente politique peut être modifiée. Toute modification substantielle est portée à la connaissance des utilisateurs dans l'application.",
      ],
    },
  ],
};

const regles: DocumentLegal = {
  cle: "regles",
  titre: "Règles de la communauté",
  sousTitre: "Ce qui est attendu, ce qui ne passe pas, et ce qui arrive ensuite",
  miseAJour: MAJ,
  sections: [
    {
      titre: "L'esprit",
      paragraphes: [
        "CampusLife rassemble des étudiants d'un même établissement. On s'y croise en cours. Le fil n'est pas un réseau social ouvert : écrivez ce que vous assumeriez de dire à voix haute dans un amphi.",
      ],
    },
    {
      titre: "Ce qui n'a pas sa place ici",
      paragraphes: [
        "Le harcèlement, les moqueries répétées, les propos injurieux, racistes, sexistes, homophobes ou visant un handicap.",
        "Les contenus à caractère sexuel, la violence gratuite, l'incitation à la haine.",
        "La publicité, le démarchage, les chaînes et les messages envoyés en série.",
        "La diffusion d'informations personnelles concernant quelqu'un d'autre : numéro, adresse, emploi du temps, photo sans accord.",
        "L'usurpation d'identité, y compris celle d'un enseignant ou d'un service de l'établissement.",
        "Les sujets d'examen, corrigés ou documents obtenus frauduleusement.",
        "Les fausses informations présentées comme certaines lorsqu'elles peuvent nuire, en matière de santé ou de sécurité notamment.",
      ],
    },
    {
      titre: "Ce qui a toute sa place",
      paragraphes: [
        "Le désaccord, la critique d'un cours, d'une organisation ou d'une décision, l'humour, les questions qui paraissent bêtes. Une communauté d'entraide qui n'accepte que les avis polis n'aide personne.",
      ],
    },
    {
      titre: "Signaler",
      paragraphes: [
        "Chaque publication et chaque commentaire peut être signalé depuis le menu situé à droite du contenu. Cinq motifs sont proposés : spam ou publicité, harcèlement, contenu choquant, fausse information, autre.",
        "Le signalement est confidentiel. L'auteur du contenu n'est pas informé de l'identité de la personne qui a signalé.",
      ],
    },
    {
      titre: "Ce qui se passe ensuite",
      paragraphes: [
        "Les signalements sont examinés dans les meilleurs délais. Le service étant en phase de test, aucun délai de traitement n'est garanti à ce stade.",
        "Selon la gravité, la réponse va du retrait du contenu à la suspension puis à la fermeture définitive du compte. Un premier manquement mineur donne lieu à un simple retrait accompagné d'un rappel des règles.",
        "Lorsque la sécurité d'une personne paraît menacée, ou lorsque les faits sont susceptibles de constituer une infraction, la fermeture est immédiate et les autorités compétentes peuvent être saisies.",
      ],
    },
    {
      titre: "Contester",
      paragraphes: [
        "Une décision de modération peut être contestée en écrivant à " + EDITEUR.courriel + ". Indiquez le contenu concerné et les raisons pour lesquelles vous estimez la mesure infondée.",
      ],
    },
    {
      titre: "Si ça va mal",
      paragraphes: [
        "Ces règles traitent de ce qui se publie ici, pas de ce que vous traversez. Si vous n'allez pas bien, le service de santé universitaire de votre établissement reçoit gratuitement et sans jugement. Le 3114, numéro national de prévention du suicide, répond gratuitement, à toute heure.",
      ],
    },
  ],
};

export const DOCUMENTS: Record<string, DocumentLegal> = {
  cgu,
  confidentialite,
  regles,
};

export const LISTE_DOCUMENTS = [cgu, confidentialite, regles].map((d) => ({
  cle: d.cle,
  titre: d.titre,
}));
