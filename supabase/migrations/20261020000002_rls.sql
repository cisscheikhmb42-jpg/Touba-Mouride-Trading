-- =====================================================================
-- Row Level Security
-- ---------------------------------------------------------------------
-- Public (anon) : lecture seule des données publiques du catalogue.
-- Administrateurs (public.is_admin()) : gestion complète.
-- Commandes : jamais lisibles par les visiteurs. La création passe
-- uniquement par la fonction public.create_order (validation serveur).
-- =====================================================================

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;
alter table public.blog_posts enable row level security;

-- Privilèges explicites (RLS filtre ensuite les lignes).
revoke all on all tables in schema public from anon, authenticated;

grant select on public.categories, public.products, public.product_images,
  public.product_variants, public.delivery_zones, public.store_settings,
  public.blog_posts to anon, authenticated;

grant insert, update, delete on public.categories, public.products,
  public.product_images, public.product_variants, public.delivery_zones,
  public.blog_posts to authenticated;

grant update on public.store_settings to authenticated;
grant select, update, delete on public.orders, public.order_items to authenticated;
grant select on public.admin_users to authenticated;

-- ---------------------------------------------------------------------
-- admin_users : un utilisateur voit uniquement sa propre ligne.
-- Aucune écriture via l'API : l'ajout d'un admin se fait en SQL.
-- ---------------------------------------------------------------------
create policy "admin_users: lecture de sa propre ligne"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Catégories
-- ---------------------------------------------------------------------
create policy "categories: lecture publique des catégories actives"
on public.categories for select to anon, authenticated
using (is_active or (select public.is_admin()));

create policy "categories: insertion admin"
on public.categories for insert to authenticated
with check ((select public.is_admin()));

create policy "categories: modification admin"
on public.categories for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "categories: suppression admin"
on public.categories for delete to authenticated
using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Produits
-- ---------------------------------------------------------------------
create policy "products: lecture publique des produits publiés"
on public.products for select to anon, authenticated
using (is_published or (select public.is_admin()));

create policy "products: insertion admin"
on public.products for insert to authenticated
with check ((select public.is_admin()));

create policy "products: modification admin"
on public.products for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products: suppression admin"
on public.products for delete to authenticated
using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Images produits
-- ---------------------------------------------------------------------
create policy "product_images: lecture publique si produit publié"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_published
  )
  or (select public.is_admin())
);

create policy "product_images: insertion admin"
on public.product_images for insert to authenticated
with check ((select public.is_admin()));

create policy "product_images: modification admin"
on public.product_images for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product_images: suppression admin"
on public.product_images for delete to authenticated
using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Variantes
-- ---------------------------------------------------------------------
create policy "product_variants: lecture publique si produit publié"
on public.product_variants for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_variants.product_id and p.is_published
  )
  or (select public.is_admin())
);

create policy "product_variants: insertion admin"
on public.product_variants for insert to authenticated
with check ((select public.is_admin()));

create policy "product_variants: modification admin"
on public.product_variants for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product_variants: suppression admin"
on public.product_variants for delete to authenticated
using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Zones de livraison
-- ---------------------------------------------------------------------
create policy "delivery_zones: lecture publique des zones actives"
on public.delivery_zones for select to anon, authenticated
using (is_active or (select public.is_admin()));

create policy "delivery_zones: insertion admin"
on public.delivery_zones for insert to authenticated
with check ((select public.is_admin()));

create policy "delivery_zones: modification admin"
on public.delivery_zones for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "delivery_zones: suppression admin"
on public.delivery_zones for delete to authenticated
using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Commandes : administrateurs uniquement (aucune politique pour anon).
-- Pas de politique INSERT : création via public.create_order().
-- ---------------------------------------------------------------------
create policy "orders: lecture admin"
on public.orders for select to authenticated
using ((select public.is_admin()));

create policy "orders: modification admin"
on public.orders for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "orders: suppression admin"
on public.orders for delete to authenticated
using ((select public.is_admin()));

create policy "order_items: lecture admin"
on public.order_items for select to authenticated
using ((select public.is_admin()));

create policy "order_items: modification admin"
on public.order_items for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "order_items: suppression admin"
on public.order_items for delete to authenticated
using ((select public.is_admin()));

-- Les colonnes sensibles au stock ne se modifient que via les fonctions.
revoke update on public.orders from authenticated;
grant update (internal_notes)
  on public.orders to authenticated;
revoke update on public.order_items from authenticated;

-- ---------------------------------------------------------------------
-- Paramètres boutique : lecture publique, modification admin.
-- ---------------------------------------------------------------------
create policy "store_settings: lecture publique"
on public.store_settings for select to anon, authenticated
using (true);

create policy "store_settings: modification admin"
on public.store_settings for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------
create policy "blog_posts: lecture publique des articles publiés"
on public.blog_posts for select to anon, authenticated
using (is_published or (select public.is_admin()));

create policy "blog_posts: insertion admin"
on public.blog_posts for insert to authenticated
with check ((select public.is_admin()));

create policy "blog_posts: modification admin"
on public.blog_posts for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "blog_posts: suppression admin"
on public.blog_posts for delete to authenticated
using ((select public.is_admin()));
