# Guide de l'administrateur

Adresse : `https://<votre-site>/admin` (lien discret « Espace administrateur »
en bas de chaque page). Connexion avec l'e-mail et le mot de passe créés dans
Supabase (voir docs/SUPABASE.md § 6).

## Tableau de bord : « Pour démarrer »
Le tableau de bord affiche la liste de ce qui manque encore (logo, photo de
l'accueil, produits, photos, prix, frais de livraison, images des catégories).
Chaque ligne est un lien direct vers la bonne page.

## Ajouter un produit
1. **Produits > Ajouter un produit**.
2. Renseignez le nom (français, et wolof si vous l'avez), la catégorie, la
   description. Le slug (adresse de la page) est créé automatiquement.
3. **Prix** en FCFA, sans espace ni point (ex. `15000`). Laissez vide si le
   prix n'est pas fixé : le site affichera « Prix à confirmer ».
4. Cochez **Publié sur le site** quand la fiche est prête (sinon brouillon
   invisible). **Disponible à la commande** permet de suspendre les ventes.
5. **Créer le produit** : vous arrivez sur la fiche d'édition pour ajouter
   photos et variantes.

## Modifier un prix
Produits > cliquez sur le produit > champ **Prix (FCFA)** > **Enregistrer le
produit**. Le site est mis à jour immédiatement ; les commandes passées
gardent l'ancien prix. Un client dont le panier contient l'article verra
« Le prix de … a changé ».
Prix différent pour une taille : renseignez le prix de la **variante**.

## Ajouter des photos
Sur la fiche produit, zone **Photos > Ajouter des photos** : choisissez une ou
plusieurs images (JPEG, PNG, WebP). Elles sont automatiquement redimensionnées
et converties. Ensuite :
- **Monter / Descendre** : ordre de la galerie (la première = vignette) ;
- **Texte alternatif** : décrivez la photo (ex. « Jallabe blanc à capuche,
  vue de face ») ;
- **Supprimer la photo**.

Vidéo : collez une URL https (fichier MP4 dans le bucket `videos`, ou lien
d'un service vidéo) dans **Vidéo**. La vidéo de l'accueil s'envoie dans
**Paramètres > Logo et visuels**.

## Variantes (tailles, pointures, couleurs)
Sur la fiche produit, **Nouvelle variante** : taille/pointure et/ou couleur,
prix (vide = prix du produit), stock, disponibilité. N'ajoutez que les
variantes réellement disponibles. Le client doit en choisir une.

## Modifier un stock
- Cochez **Suivre le stock** sur le produit.
- Sans variantes : champ **Stock (sans variantes)**. Avec variantes : champ
  **Stock** de chaque variante.
- Le tableau de bord signale les **alertes de stock** (seuil réglable par
  produit, 3 par défaut).
- Le stock est retiré quand **vous confirmez** une commande et restitué si
  vous l'annulez (docs/STOCK-ET-COMMANDES.md).

## Modifier les frais de livraison
**Livraison** : pour chaque zone, renseignez les **Frais (FCFA)** et
éventuellement un **délai indicatif** réel, puis Enregistrer. Laisser vide =
« à confirmer sur WhatsApp ». Vous pouvez ajouter, désactiver ou supprimer
une zone (ex. activer « Retrait » une fois l'option confirmée).

## Consulter les commandes
**Commandes** : liste filtrable par statut, recherche par référence, nom ou
téléphone. Cliquez sur une référence pour voir le client, les articles, les
montants et le message WhatsApp préparé. Le bouton **Écrire au client** ouvre
WhatsApp vers son numéro.

⚠️ Une demande enregistrée ne garantit pas que le client a envoyé le message
WhatsApp : vérifiez la conversation avant de confirmer.

## Modifier le statut d'une commande
Fiche commande > **Nouveau statut** > **Mettre à jour le statut**. Vous pouvez
aussi fixer les **frais de livraison** convenus (le total est recalculé) et
ajouter des **notes internes**.

## Ajouter les liens des réseaux sociaux
**Paramètres > Réseaux sociaux** : Instagram et TikTok sont déjà renseignés ;
ajoutez Facebook ou YouTube si besoin (lien complet `https://…`). Un champ
vide masque le réseau.

## Mettre à jour les informations de la boutique
**Paramètres** : nom, téléphone, numéro WhatsApp (format `221770941231`),
e-mail, localisations (une par ligne), horaires (à remplir une fois
confirmés), messages du bandeau défilant (FR et WO), description SEO.
**Logo et visuels** : envoyez le logo (PNG transparent conseillé), l'image et
la vidéo de l'accueil.

## Catégories
**Catégories** : modifiez les noms, descriptions, textes SEO, l'ordre,
l'image de chaque catégorie, ou masquez une catégorie.

## Blog
**Blog > Nouvel article** : titre, résumé, texte, image de couverture (URL),
puis cochez **Publier**. La page Blog n'est indexée par Google qu'à partir du
premier article publié.

## Assistant IA (facultatif)
Si une clé `ANTHROPIC_API_KEY` est configurée sur le serveur, la fiche produit
propose **Proposer une description** : un brouillon rédigé uniquement à partir
des informations que vous fournissez. Il n'est jamais enregistré
automatiquement : relisez-le, corrigez-le, puis collez-le dans la description.
