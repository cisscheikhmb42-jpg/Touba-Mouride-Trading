# Paiement en ligne — état et préparation

## État actuel
**Aucun paiement en ligne n'est actif.** Le client compose son panier, le site
prépare le récapitulatif et le client l'envoie sur WhatsApp. Le paiement et la
confirmation sont organisés directement par la boutique.

Le site n'affiche aucun bouton de paiement, ne simule aucune transaction et ne
demande aucune information bancaire.

## Architecture prête
`src/lib/payments/index.ts` définit l'interface `PaymentProvider`
(`createSession`, `verifyWebhook`) ; `getPaymentProvider()` renvoie `null`.

## Avant d'activer un prestataire adapté au Sénégal
1. Choisir le prestataire (agrégateur de mobile money / cartes) et signer le contrat.
2. Obtenir des identifiants de **test** puis de **production**.
3. Les enregistrer dans Vercel en variables **serveur** (sans `NEXT_PUBLIC_`).
4. Implémenter le prestataire et une route de webhook signée.
5. Définir les règles : montant payé = total confirmé, gestion des échecs,
   remboursements, et passage du statut de commande uniquement après
   validation du webhook.
6. Tester de bout en bout en mode test avant toute mise en production.
