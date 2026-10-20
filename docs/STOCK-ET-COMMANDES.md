# Commandes WhatsApp et règle de stock

## Parcours client

1. Le client ajoute des articles au panier (conservé dans le navigateur,
   `localStorage`, même après rechargement).
2. Sur la page Panier, le site demande à Supabase un **devis** (`quote_cart`) :
   prix, variantes, disponibilités et stocks **réels**. Les prix stockés dans
   le navigateur ne servent qu'à détecter un changement : le client voit
   « Le prix de X a changé : ancien → nouveau ».
3. Le client renseigne nom, téléphone, zone, adresse/quartier, instructions.
4. `POST /api/orders` valide les champs (zod), recalcule le devis, construit le
   message, puis appelle `create_order`, qui **revérifie tout en base** et
   refuse si un montant affiché a changé (`PRICE_CHANGED`).
5. Si Supabase confirme l'enregistrement, le site affiche la référence
   (`TMT-AAMMJJ-XXXX`) et le bouton **« Ouvrir WhatsApp et envoyer »**
   (`https://wa.me/221770941231?text=…`, texte encodé).
6. **Le client doit appuyer sur « Envoyer » dans WhatsApp.** Le site ne peut
   pas savoir si le message a été envoyé ; il ne l'affirme jamais.
7. Si l'enregistrement échoue, un message d'erreur clair s'affiche et aucune
   référence n'est donnée.

## Montants

- Prix manquant → ligne « Prix à confirmer », sous-total « des articles au
  prix confirmé », **pas de total**.
- Frais de zone inconnus → « Frais de livraison à confirmer sur WhatsApp »,
  **pas de total**.
- Total affiché uniquement si tous les prix et les frais sont connus.

## Statuts

`pending` (en attente) · `awaiting_confirmation` (statut de toute nouvelle
demande) · `confirmed` · `preparing` · `shipped` · `delivered` · `cancelled`.
Aucune commande n'est confirmée automatiquement.

## Règle de gestion du stock

Concerne uniquement les produits dont « Suivre le stock » est coché.

1. **Demande / ouverture de WhatsApp : aucun retrait de stock.** Le stock est
   seulement vérifié (un client ne peut pas demander plus que le disponible).
2. **Confirmation par l'administrateur** (passage à `confirmed`, `preparing`,
   `shipped` ou `delivered` pour la première fois) : le stock est retiré de
   façon **atomique** dans `admin_update_order_status` (mise à jour
   conditionnelle `stock >= quantité`, verrou sur la commande). Si le stock
   est insuffisant, rien n'est modifié et un message l'indique.
3. Pas de double retrait : un indicateur `stock_deducted` est tenu sur la
   commande, et chaque ligne mémorise s'il a été retiré du produit ou de la
   variante.
4. **Annulation** (ou retour en attente) d'une commande dont le stock a été
   retiré : le stock est **restitué**.
5. Le stock ne peut jamais devenir négatif (contrainte en base).

Testé par `npm run test:db` (décrément, absence de double décrément,
restitution, refus en cas de stock insuffisant).
