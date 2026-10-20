# Déploiement sur Vercel

## Variables d'environnement

À créer dans *Vercel > Project > Settings > Environment Variables*
(Production **et** Preview) :

| Variable | Obligatoire | Valeur |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | oui | URL publique, sans `/` final (ex. `https://www.votredomaine.sn`) |
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | Clé publique (anon / publishable) |
| `ANTHROPIC_API_KEY` | non | Active l'assistant de rédaction (serveur uniquement) |
| `AI_MODEL` | non | Modèle IA (défaut `claude-opus-5-5`) |
| `AI_MAX_REQUESTS_PER_HOUR` | non | Limite par administrateur (défaut 30) |

**Aucune clé `service_role` n'est utilisée.** Ne créez jamais de variable
secrète préfixée `NEXT_PUBLIC_`. `.env.local` est ignoré par Git ; seul
`.env.example` (sans valeur) est versionné.

Les images Supabase sont autorisées automatiquement à partir de
`NEXT_PUBLIC_SUPABASE_URL` (voir `next.config.ts`) : **redéployez** si vous
changez de projet Supabase.

## Étapes

1. Poussez le dépôt sur GitHub.
2. Vercel > *Add New > Project* > importez le dépôt (framework détecté :
   Next.js ; commande `next build`).
3. Ajoutez les variables ci-dessus, puis **Deploy**.
4. *Settings > Domains* : ajoutez votre nom de domaine, puis mettez à jour
   `NEXT_PUBLIC_SITE_URL` et la *Site URL* Supabase, et redéployez.

## Contenu (ordre conseillé)

1. Migrations Supabase (docs/SUPABASE.md § 2).
2. Premier administrateur (§ 6).
3. Paramètres : logo, horaires si confirmés, frais de livraison réels.
4. Produits : création, photos, variantes, prix, stocks, publication.
5. Remplacer les textes juridiques provisoires (`src/content/legal.ts`) après
   validation.

## Vérifications avant mise en ligne

- [ ] `npm run lint`, `npm run typecheck`, `npm run build` sans erreur.
- [ ] Connexion admin OK ; un compte non inscrit dans `admin_users` est refusé.
- [ ] Inscriptions publiques désactivées dans Supabase Auth.
- [ ] Une commande test : demande enregistrée, message WhatsApp correct, puis
      commande test annulée/supprimée dans l'admin.
- [ ] `https://<site>/sitemap.xml` et `/robots.txt` pointent vers le bon domaine.
- [ ] Textes wolof relus par un locuteur natif.
- [ ] Textes juridiques validés.
- [ ] Google Search Console : ajouter la propriété du domaine, vérifier (DNS),
      soumettre `/sitemap.xml`.
- [ ] Tester sur un vrai téléphone (réseau mobile) et mesurer avec
      PageSpeed Insights / Lighthouse.
