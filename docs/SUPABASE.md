# Supabase — configuration

## 1. Créer le projet

1. Sur https://supabase.com/dashboard, créez un **nouveau projet** dédié à
   TOUBA MOURIDE TRADING (ne réutilisez pas un projet d'une autre activité).
   Région conseillée : la plus proche du Sénégal disponible (ex. `eu-west`).
2. Notez dans *Project Settings > API* : l'URL du projet et la clé publique
   (`anon` / *publishable*). **Aucune clé `service_role` n'est nécessaire**
   au fonctionnement du site.

## 2. Appliquer les migrations

Les migrations versionnées sont dans `supabase/migrations/` (à appliquer
dans l'ordre) :

| Fichier | Contenu |
|---|---|
| `…0001_schema.sql` | Tables, contraintes, index, déclencheurs (`updated_at`, recherche) |
| `…0002_rls.sql` | Activation RLS, privilèges, politiques |
| `…0003_order_functions.sql` | `quote_cart`, `create_order`, `admin_update_order_status`, `admin_set_order_delivery_fee`, `admin_dashboard_stats` |
| `…0004_storage.sql` | Buckets `media` et `videos` + politiques |
| `…0005_reference_data.sql` | Paramètres boutique, 10 catégories, 3 zones (frais vides) |

Avec la CLI :

```bash
npx supabase login
npx supabase link --project-ref <ref-du-projet>
npx supabase db push
```

Ou, sans CLI : *SQL Editor* du tableau de bord, coller et exécuter chaque
fichier dans l'ordre.

Vérification (base locale ou distante) : `npm run test:db` avec
`DB_URL=<chaîne de connexion>` — **sur une base de test uniquement**
(le script crée puis annule des données dans une transaction).

## 3. Schéma

```
categories (1) ──< products (1) ──< product_images
                          └──────< product_variants
delivery_zones (1) ──< orders (1) ──< order_items  (instantané nom/variante/prix)
store_settings (ligne unique)   blog_posts   admin_users ─ auth.users
```

- Montants : `numeric(12,0)` en FCFA (XOF). `price` **NULL = « Prix à confirmer »**.
- `compare_at_price` doit être > `price` (contrainte).
- `stock_quantity >= 0` (contrainte) ; `track_inventory` active le suivi.
- `delivery_zones.fee` NULL = « frais à confirmer sur WhatsApp ».
- `orders.subtotal` / `total` NULL tant qu'un prix ou les frais sont inconnus ;
  `priced_subtotal` = somme des lignes au prix connu.
- `order_items` conserve nom, référence, variante et prix au moment de la
  commande : modifier ou supprimer un produit ne change pas l'historique.

## 4. Sécurité (RLS)

| Table | Visiteur (anon) | Connecté non admin | Admin (`admin_users`) |
|---|---|---|---|
| categories | lecture des actives | idem | tout |
| products / images / variantes | lecture des produits **publiés** | idem | tout |
| delivery_zones | lecture des actives | idem | tout |
| store_settings | lecture | lecture | modification |
| orders / order_items | **aucun accès** | **aucun accès** | lecture, notes ; statut et frais via fonctions |
| admin_users | — | sa propre ligne | sa propre ligne (ajout en SQL uniquement) |

- Être connecté **ne donne aucun droit** : seul `public.is_admin()` (présence
  dans `admin_users`) ouvre l'administration.
- Les visiteurs ne créent une commande **que** via `create_order`, qui
  recalcule prix, stocks et frais en base, limite les abus (5 demandes / 15 min
  par téléphone, 30 / min au total) et refuse un récapitulatif obsolète.
- Le statut d'une commande ne peut pas être modifié directement : il passe
  par `admin_update_order_status` (règle de stock atomique).

## 5. Storage

- Bucket **`media`** (public, 5 Mo, JPEG/PNG/WebP/AVIF) : `products/<id>/…`,
  `categories/<id>/…`, `brand/…`. Les images sont redimensionnées (1600 px)
  et converties en WebP dans le navigateur avant l'envoi.
- Bucket **`videos`** (public, 50 Mo, MP4/WebM).
- Lecture : URL publique (pas de listing anonyme). Écriture/suppression :
  administrateurs uniquement.
- **Limites à vérifier** dans *Organization > Billing* avant d'envoyer des
  vidéos : sur l'offre gratuite, la taille maximale par fichier est de 50 Mo
  et l'espace de stockage ainsi que la bande passante sortante (egress) sont
  plafonnés. Pour des vidéos longues ou très regardées, préférez un service
  vidéo (YouTube non répertorié, Cloudflare Stream, Mux…) et collez simplement
  l'URL https de la vidéo dans la fiche produit.

## 6. Créer le premier administrateur

1. *Authentication > Providers > Email* : laissez l'e-mail activé et
   **désactivez « Allow new users to sign up »** (personne ne doit pouvoir
   créer de compte depuis le site).
2. *Authentication > Users > Add user > Create new user* : e-mail du
   propriétaire (ex. pbsking98@gmail.com), mot de passe fort, cochez
   « Auto confirm user ».
3. *SQL Editor* :
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'pbsking98@gmail.com';
   ```
4. Connexion sur `https://<votre-site>/admin`.

Pour retirer un administrateur :
`delete from public.admin_users where user_id = (select id from auth.users where email = '…');`

Aucun mot de passe n'est stocké dans le code : Supabase Auth les conserve hachés.

## 7. URL d'authentification

*Authentication > URL Configuration* : *Site URL* = l'adresse du site en
production (ex. `https://www.votredomaine.sn`).
