/**
 * Textes juridiques PROVISOIRES (français). Ils ne sont pas une
 * certification de conformité : à faire vérifier et compléter par le
 * propriétaire (et idéalement un juriste) avant publication définitive.
 * Les informations non fournies (horaires, retours, paiement) ne sont
 * volontairement PAS inventées.
 */
export type LegalSection = { title: string; paragraphs: string[]; list?: string[] };

export const privacy: LegalSection[] = [
  {
    title: "Responsable du traitement",
    paragraphs: [
      "Le site est édité par TOUBA MOURIDE TRADING (Liberté 5, Dakar et Keur Massar — Sénégal). Contact : pbsking98@gmail.com, 77 094 12 31.",
    ],
  },
  {
    title: "Données collectées",
    paragraphs: ["Lors d'une demande de commande, nous collectons uniquement les informations nécessaires à son traitement :"],
    list: [
      "nom complet ;",
      "numéro de téléphone ;",
      "zone de livraison et adresse ou quartier ;",
      "instructions facultatives que vous choisissez d'ajouter ;",
      "le contenu de la commande (articles, quantités, montants connus).",
    ],
  },
  {
    title: "Finalités",
    paragraphs: [
      "Ces données servent à préparer, confirmer et livrer votre commande, et à vous recontacter à son sujet. Elles ne sont ni vendues ni utilisées à des fins publicitaires.",
    ],
  },
  {
    title: "WhatsApp",
    paragraphs: [
      "Le site prépare un message que vous envoyez vous-même depuis WhatsApp. Les échanges sur WhatsApp sont soumis aux conditions et à la politique de confidentialité de WhatsApp.",
    ],
  },
  {
    title: "Hébergement et conservation",
    paragraphs: [
      "Les demandes de commande sont enregistrées dans une base de données hébergée par Supabase et le site est hébergé par Vercel. L'accès aux commandes est réservé aux administrateurs de la boutique. La durée de conservation sera précisée par la boutique.",
    ],
  },
  {
    title: "Stockage local et cookies",
    paragraphs: [
      "Votre panier est conservé dans le stockage local de votre navigateur (sur votre appareil). Un cookie mémorise la langue choisie. L'espace administrateur utilise des cookies de session. Aucun cookie publicitaire n'est utilisé.",
    ],
  },
  {
    title: "Vos droits",
    paragraphs: [
      "Conformément à la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à pbsking98@gmail.com. Vous pouvez également saisir la Commission de Protection des Données Personnelles (CDP).",
    ],
  },
];

export const terms: LegalSection[] = [
  {
    title: "Objet",
    paragraphs: [
      "Les présentes conditions encadrent les demandes de commande passées sur le site de TOUBA MOURIDE TRADING.",
    ],
  },
  {
    title: "Commande",
    paragraphs: [
      "Le client compose son panier, renseigne ses coordonnées puis envoie le message de commande préparé sur WhatsApp. La demande est enregistrée « en attente de confirmation ».",
      "La commande n'est définitive qu'après confirmation explicite de la boutique (disponibilité, montants et modalités de livraison). L'ouverture de WhatsApp ou l'envoi du message ne vaut pas confirmation.",
    ],
  },
  {
    title: "Prix",
    paragraphs: [
      "Les prix sont indiqués en francs CFA (FCFA). Lorsqu'un prix n'est pas encore confirmé, la mention « Prix à confirmer » est affichée et aucun total n'est calculé ; le prix est alors communiqué par la boutique avant toute confirmation.",
      "Les prix affichés sont vérifiés au moment de la demande. En cas de modification, le client en est informé avant l'envoi.",
    ],
  },
  {
    title: "Livraison",
    paragraphs: [
      "Les frais et délais de livraison dépendent de la zone. Lorsqu'ils ne sont pas affichés, ils sont communiqués par la boutique sur WhatsApp avant confirmation.",
    ],
  },
  {
    title: "Paiement",
    paragraphs: ["Les modalités de paiement sont précisées par la boutique lors de la confirmation de la commande."],
  },
  {
    title: "Retours et réclamations",
    paragraphs: [
      "Les conditions de retour et d'échange seront précisées par la boutique. Pour toute réclamation, contactez-nous sur WhatsApp au 77 094 12 31 ou à pbsking98@gmail.com.",
    ],
  },
];

export const deliveryIntro: LegalSection[] = [
  {
    title: "Fonctionnement",
    paragraphs: [
      "Choisissez votre zone de livraison dans le panier. Si les frais de votre zone sont connus, ils sont ajoutés au récapitulatif ; sinon, la boutique vous les communique sur WhatsApp avant toute confirmation.",
      "Les localisations Liberté 5 (Dakar) et Keur Massar sont celles communiquées par la boutique ; un éventuel retrait sur place doit être confirmé avec la boutique.",
    ],
  },
  {
    title: "Retours",
    paragraphs: ["Les conditions de retour et d'échange seront précisées prochainement par la boutique."],
  },
];
