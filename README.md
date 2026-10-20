# TOUBA MOURIDE TRADING — Boutique en ligne

Boutique e-commerce bilingue (français / wolof) pour le Sénégal : catalogue
dynamique, panier, demandes de commande préparées sur WhatsApp, espace
administrateur, référencement naturel.

**Stack :** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript ·
Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage, RLS) · Vercel.

## Démarrage rapide (local)

```bash
npm install
cp .env.example .env.local          # puis renseigner les variables
npx supabase start                  # Supabase local (Docker requis)
npx supabase db reset               # applique supabase/migrations
npm run dev                         # http://localhost:3000
```

Sans Supabase configuré, le site démarre quand même (catalogue vide,
commandes désactivées avec un message clair).

## Documentation

| Fichier | Contenu |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Organisation du code, pages, cache, sécurité |
| [docs/SUPABASE.md](docs/SUPABASE.md) | Schéma, migrations, RLS, Storage, premier administrateur |
| [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) | Vercel, variables d'environnement, vérifications avant mise en ligne |
| [docs/GUIDE-ADMIN.md](docs/GUIDE-ADMIN.md) | Ajouter un produit, des photos, gérer stocks, livraison, commandes |
| [docs/STOCK-ET-COMMANDES.md](docs/STOCK-ET-COMMANDES.md) | Règle de gestion du stock et fonctionnement WhatsApp |
| [docs/A-COMPLETER.md](docs/A-COMPLETER.md) | Informations commerciales manquantes et points à valider |

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Développement |
| `npm run build` / `npm start` | Production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run test:db` | Tests SQL (RLS, commandes, stock) sur la base locale |
| `npm run test:e2e` | Tests navigateur (voir l'en-tête de `tests/e2e.mjs`) |
