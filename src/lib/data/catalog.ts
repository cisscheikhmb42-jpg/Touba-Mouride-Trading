import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/public";
import type { BlogPost, Category, DeliveryZone, Product, StoreSettings } from "@/lib/types";
import { siteDefaults } from "@/lib/site";

/**
 * Lecture du catalogue public (clé anonyme + RLS), mise en cache.
 * Les mutations de l'administration invalident ces étiquettes.
 */
export const TAGS = {
  catalog: "catalog",
  settings: "settings",
  delivery: "delivery",
  blog: "blog",
} as const;

const PRODUCT_SELECT =
  "*, product_images(*), product_variants(*)" as const;

function sortChildren(p: Product): Product {
  p.product_images.sort((a, b) => a.position - b.position);
  p.product_variants.sort((a, b) => a.position - b.position);
  return p;
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(TAGS.catalog);
  const supabase = getPublicSupabase();
  if (!supabase) {
    cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
    return [];
  }
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    cacheLife("minutes"); // réessaie rapidement en cas d'erreur
    console.error("[catalog] categories", error.message);
    return [];
  }
  cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
  return data as Category[];
}

/**
 * Requête dédiée par slug (clé de cache propre) : une catégorie créée après
 * le déploiement est trouvée dès la première visite.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  "use cache";
  cacheTag(TAGS.catalog);
  const supabase = getPublicSupabase();
  if (!supabase || !/^[a-z0-9-]{1,120}$/.test(slug)) {
    cacheLife("minutes");
    return null;
  }
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) {
    cacheLife("minutes");
    console.error("[catalog] category", error.message);
    return null;
  }
  cacheLife("minutes");
  return (data as Category | null) ?? null;
}

/** Tous les produits publiés (le catalogue reste de taille raisonnable). */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.catalog);
  const supabase = getPublicSupabase();
  if (!supabase) {
    cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
    return [];
  }
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    cacheLife("minutes"); // réessaie rapidement en cas d'erreur
    console.error("[catalog] products", error.message);
    return [];
  }
  cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
  return (data as Product[]).map(sortChildren);
}

/** Requête dédiée par slug (voir getCategoryBySlug). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag(TAGS.catalog);
  const supabase = getPublicSupabase();
  if (!supabase || !/^[a-z0-9-]{1,120}$/.test(slug)) {
    cacheLife("minutes");
    return null;
  }
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) {
    cacheLife("minutes");
    console.error("[catalog] product", error.message);
    return null;
  }
  cacheLife("minutes");
  return data ? sortChildren(data as Product) : null;
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  "use cache";
  cacheTag(TAGS.delivery);
  const supabase = getPublicSupabase();
  if (!supabase) {
    cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
    return [];
  }
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    cacheLife("minutes"); // réessaie rapidement en cas d'erreur
    console.error("[catalog] delivery_zones", error.message);
    return [];
  }
  cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
  return data as DeliveryZone[];
}

const fallbackSettings: StoreSettings = {
  business_name: siteDefaults.businessName,
  phone_display: siteDefaults.phoneDisplay,
  phone_international: siteDefaults.phoneInternational,
  whatsapp_number: siteDefaults.whatsappNumber,
  email: siteDefaults.email,
  locations: [...siteDefaults.locations],
  opening_hours_fr: null,
  opening_hours_wo: null,
  instagram_url: siteDefaults.instagramUrl,
  tiktok_url: siteDefaults.tiktokUrl,
  facebook_url: null,
  youtube_url: null,
  logo_url: null,
  hero_image_url: null,
  hero_video_url: null,
  announcement_enabled: true,
  announcement_fr: [
    "Bienvenue chez TOUBA MOURIDE TRADING",
    "Découvrez notre collection d'accessoires mourides",
    "Retrouvez nos produits et contactez-nous sur WhatsApp",
  ],
  announcement_wo: [
    "Dalal ak jàmm ci TOUBA MOURIDE TRADING",
    "Xoolal sunu jumtukaay yu mouride yi",
    "Xoolal sunu produit yi te jokkoo ak nun ci WhatsApp",
  ],
  seo_description_fr: null,
  seo_description_wo: null,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(TAGS.settings);
  const supabase = getPublicSupabase();
  if (!supabase) {
    cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
    return fallbackSettings;
  }
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    cacheLife("minutes");
    if (error) console.error("[catalog] store_settings", error.message);
    return fallbackSettings;
  }
  cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
  return data as StoreSettings;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  "use cache";
  cacheTag(TAGS.blog);
  const supabase = getPublicSupabase();
  if (!supabase) {
    cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
    return [];
  }
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  if (error) {
    cacheLife("minutes"); // réessaie rapidement en cas d'erreur
    console.error("[catalog] blog_posts", error.message);
    return [];
  }
  cacheLife("minutes"); // révalidé chaque minute (et immédiatement après une action admin)
  return data as BlogPost[];
}

/** Requête dédiée par slug (voir getCategoryBySlug). */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  "use cache";
  cacheTag(TAGS.blog);
  const supabase = getPublicSupabase();
  if (!supabase || !/^[a-z0-9-]{1,120}$/.test(slug)) {
    cacheLife("minutes");
    return null;
  }
  const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  cacheLife("minutes");
  if (error) {
    console.error("[catalog] blog_post", error.message);
    return null;
  }
  return (data as BlogPost | null) ?? null;
}
