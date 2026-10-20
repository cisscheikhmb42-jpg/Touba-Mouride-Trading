# Architecture

## Arborescence

```
src/
  app/
    [lang]/                 site public (fr | wo) — mise en page racine
      page.tsx              accueil
      boutique/             catalogue, recherche, filtres, tri
      categorie/[slug]/     pages catégories
      produit/[slug]/       fiches produits
      panier/               panier + formulaire de commande
      contact/ faq/ blog/ livraison-et-retours/ conditions-generales-de-vente/ confidentialite/
      [...rest]/ not-found.tsx error.tsx
    admin/                  administration (mise en page racine séparée, noindex)
      login/                connexion Supabase Auth
      (protected)/          pages réservées aux administrateurs
      actions.ts            Server Actions (toutes vérifient le rôle admin)
    api/cart/quote          devis du panier (Supabase quote_cart)
    api/orders              création d'une demande de commande + lien WhatsApp
    sitemap.ts robots.ts manifest.ts
  proxy.ts                  redirection de langue, session admin
  components/               interface (layout, catalog, cart, home, ui, admin, seo)
  i18n/                     config, dictionnaires fr.ts / wo.ts, chemins
  lib/
    data/                   lecture du catalogue (mise en cache) et règles d'affichage
    supabase/               clients public / serveur (session) / navigateur
    admin/                  garde d'accès, aides de formulaires, libellés
    ai/                     assistant IA facultatif (serveur uniquement)
    validation.ts whatsapp.ts search.ts seo.ts format.ts rate-limit.ts
  content/legal.ts          textes juridiques provisoires
supabase/
  migrations/               schéma, RLS, fonctions, storage, données de référence
  tests/                    tests SQL de sécurité et de stock
tests/e2e.mjs               test navigateur de bout en bout
```

## Données et cache

- Le catalogue public est lu avec la clé anonyme (soumise aux RLS) dans des
  fonctions `'use cache'` étiquetées (`catalog`, `settings`, `delivery`,
  `blog`). Les pages sont prérendues (Cache Components / PPR) et servies
  depuis le cache ; chaque modification dans l'administration appelle
  `updateTag(...)`, ce qui rend la modification visible immédiatement.
- Les pages dépendant de la requête (recherche, filtres, administration)
  sont rendues à la demande, sous `<Suspense>`.
- L'administration utilise la session de l'utilisateur : toutes ses
  requêtes passent par les politiques RLS (aucune clé privilégiée).

## Langues

URL distinctes `/fr/...` et `/wo/...`, `hreflang` fr-SN / wo-SN / x-default,
`<html lang>` adapté. Le choix est mémorisé (cookie `tmt_lang`) ; `/`
redirige vers la langue mémorisée. Les dictionnaires sont typés : une clé
manquante en wolof est une erreur de compilation. Pour ajouter l'anglais :
`src/i18n/config.ts` + `dictionaries/en.ts` + colonnes `*_en` en base.

## SEO

Titres et descriptions uniques, canonical, Open Graph, fil d'Ariane visible +
`BreadcrumbList`, `Store` + `WebSite` (avec SearchAction), `Product` (offre
publiée uniquement si un prix existe, disponibilité seulement si elle est
connue), `FAQPage`, `BlogPosting`. Sitemap multilingue limité aux pages
indexables ; panier, admin, API et pages filtrées exclues (noindex /
robots.txt). Vraie réponse 404 pour les robots.

## Performance et accessibilité

Images `next/image` (AVIF/WebP, tailles adaptées), photos converties en WebP
avant envoi, polices auto-hébergées (`next/font`), vidéos en
`preload="none"`, animations CSS + IntersectionObserver (aucune bibliothèque
d'animation), `prefers-reduced-motion` respecté, bandeaux défilants avec
bouton pause, carrousels utilisables au doigt, à la souris, au clavier et
avec boutons, contrastes AA, labels de formulaires, focus visible, lien
d'évitement.

## Intelligence artificielle

- **Recherche intelligente (active)** : insensible aux accents et à la casse,
  multi-mots, variantes d'écriture (djellaba → jallabe, khassaide → xassaide,
  kurus → chapelet…) dans `src/lib/search.ts`. Fonctionne en français et en
  wolof (les noms wolof sont indexés).
- **Recommandations (actives, sans IA)** : produits de la même catégorie.
- **Aide au commerçant (facultative)** : brouillon de description produit via
  l'API Claude, côté serveur, uniquement si `ANTHROPIC_API_KEY` est défini,
  limité par administrateur et par heure, jamais publié automatiquement.
- **Pistes suivantes** : journal des recherches sans résultat (nouvelle table
  + insertion via fonction limitée), assistant d'aide au choix appuyé sur le
  catalogue, génération des textes wolof à faire relire.
