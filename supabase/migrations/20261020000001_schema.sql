-- =====================================================================
-- TOUBA MOURIDE TRADING — Schéma initial
-- ---------------------------------------------------------------------
-- Tables : catégories, produits, images, variantes, zones de livraison,
-- commandes, lignes de commande, paramètres boutique, blog, admins.
-- Montants : numeric(12,0) en FCFA (XOF), sans décimales, jamais de float.
-- Un prix NULL signifie « Prix à confirmer » (jamais de prix fictif).
-- =====================================================================

create extension if not exists unaccent with schema extensions;

-- Schéma interne non exposé par l'API (fonctions utilitaires).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Normalisation pour la recherche (minuscules, sans accents).
create or replace function private.normalize_search(input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(input, '')));
$$;

-- ---------------------------------------------------------------------
-- Administrateurs
-- Un utilisateur Supabase Auth n'est administrateur QUE s'il figure
-- dans cette table. Être connecté ne suffit pas.
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Catégories
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null check (char_length(name_fr) between 1 and 120),
  name_wo text not null check (char_length(name_wo) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description_fr text,
  description_wo text,
  image_url text,
  image_storage_path text,
  seo_title_fr text,
  seo_title_wo text,
  seo_description_fr text,
  seo_description_wo text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_active_sort_idx on public.categories (is_active, sort_order);

create trigger categories_updated_at before update on public.categories
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Produits
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name_fr text not null check (char_length(name_fr) between 1 and 160),
  name_wo text not null check (char_length(name_wo) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description_fr text,
  description_wo text,
  -- NULL = prix à confirmer.
  price numeric(12, 0) check (price is null or price >= 0),
  -- Prix barré : uniquement s'il existe un prix et qu'il lui est supérieur.
  compare_at_price numeric(12, 0),
  sku text unique,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  track_inventory boolean not null default false,
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  -- Brouillon tant que le propriétaire n'a pas publié la fiche.
  is_published boolean not null default false,
  video_url text,
  video_storage_path text,
  seo_title_fr text,
  seo_title_wo text,
  seo_description_fr text,
  seo_description_wo text,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_compare_at_price_check check (
    compare_at_price is null
    or (price is not null and compare_at_price > price)
  )
);

create index products_category_idx on public.products (category_id);
create index products_published_idx on public.products (is_published, created_at desc);
create index products_featured_idx on public.products (is_featured) where is_featured;

create trigger products_updated_at before update on public.products
for each row execute function private.set_updated_at();

-- security definer : le schéma private n'est pas accessible aux rôles API.
create or replace function private.products_search_text()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.search_text = private.normalize_search(
    concat_ws(' ', new.name_fr, new.name_wo, new.sku, new.description_fr, new.description_wo)
  );
  return new;
end;
$$;

create trigger products_search_text before insert or update on public.products
for each row execute function private.products_search_text();

-- ---------------------------------------------------------------------
-- Images produits (fichiers dans Supabase Storage, références ici)
-- ---------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text_fr text,
  alt_text_wo text,
  width integer,
  height integer,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, position);

-- ---------------------------------------------------------------------
-- Variantes (tailles, pointures, couleurs)
-- ---------------------------------------------------------------------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text,
  color text,
  sku text unique,
  -- NULL = même prix que le produit.
  price numeric(12, 0) check (price is null or price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_available boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_label_check check (
    nullif(trim(coalesce(size, '')), '') is not null
    or nullif(trim(coalesce(color, '')), '') is not null
  )
);

create index product_variants_product_idx on public.product_variants (product_id, position);

create trigger product_variants_updated_at before update on public.product_variants
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Zones de livraison (frais NULL = à confirmer sur WhatsApp)
-- ---------------------------------------------------------------------
create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  name_wo text,
  description text,
  description_wo text,
  fee numeric(12, 0) check (fee is null or fee >= 0),
  estimated_delivery text,
  estimated_delivery_wo text,
  is_pickup boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger delivery_zones_updated_at before update on public.delivery_zones
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------
create type public.order_status as enum (
  'pending',
  'awaiting_confirmation',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled'
);

create type public.delivery_fee_status as enum ('known', 'to_confirm');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique check (order_number ~ '^TMT-[0-9]{6}-[A-Z0-9]{4}$'),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (char_length(customer_phone) between 6 and 30),
  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  delivery_zone_name text not null,
  delivery_address text not null check (char_length(delivery_address) between 2 and 300),
  delivery_fee numeric(12, 0),
  delivery_fee_status public.delivery_fee_status not null,
  -- Somme des lignes dont le prix est connu.
  priced_subtotal numeric(12, 0) not null default 0,
  -- NULL si au moins un article n'a pas de prix confirmé.
  subtotal numeric(12, 0),
  has_unpriced_items boolean not null default false,
  -- NULL tant que le sous-total ou les frais ne sont pas connus.
  total numeric(12, 0),
  currency text not null default 'XOF',
  status public.order_status not null default 'awaiting_confirmation',
  stock_deducted boolean not null default false,
  customer_notes text check (customer_notes is null or char_length(customer_notes) <= 500),
  internal_notes text,
  whatsapp_message text,
  locale text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_phone_created_idx on public.orders (customer_phone, created_at desc);

create trigger orders_updated_at before update on public.orders
for each row execute function private.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- Instantané au moment de la commande (ne change jamais ensuite).
  product_name text not null,
  product_sku text,
  variant_description text,
  quantity integer not null check (quantity between 1 and 99),
  unit_price numeric(12, 0),
  line_total numeric(12, 0),
  -- 'product' | 'variant' | NULL : d'où le stock a été retiré (pour restitution).
  stock_deducted_from text check (stock_deducted_from in ('product', 'variant')),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- Paramètres publics de la boutique (une seule ligne)
-- ---------------------------------------------------------------------
create table public.store_settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null,
  phone_display text not null,
  phone_international text not null,
  whatsapp_number text not null check (whatsapp_number ~ '^[0-9]{8,15}$'),
  email text,
  locations text[] not null default '{}',
  opening_hours_fr text,
  opening_hours_wo text,
  instagram_url text,
  tiktok_url text,
  facebook_url text,
  youtube_url text,
  logo_url text,
  hero_image_url text,
  hero_video_url text,
  announcement_enabled boolean not null default true,
  announcement_fr text[] not null default '{}',
  announcement_wo text[] not null default '{}',
  seo_description_fr text,
  seo_description_wo text,
  updated_at timestamptz not null default now()
);

create trigger store_settings_updated_at before update on public.store_settings
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Blog (guides et contenus à publier ultérieurement)
-- ---------------------------------------------------------------------
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_fr text not null,
  title_wo text,
  excerpt_fr text,
  excerpt_wo text,
  content_fr text not null default '',
  content_wo text,
  cover_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger blog_posts_updated_at before update on public.blog_posts
for each row execute function private.set_updated_at();
