import type { Locale } from "@/i18n/config";

export type Category = {
  id: string;
  name_fr: string;
  name_wo: string;
  slug: string;
  description_fr: string | null;
  description_wo: string | null;
  image_url: string | null;
  seo_title_fr: string | null;
  seo_title_wo: string | null;
  seo_description_fr: string | null;
  seo_description_wo: string | null;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string | null;
  alt_text_fr: string | null;
  alt_text_wo: string | null;
  width: number | null;
  height: number | null;
  position: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  price: number | null;
  stock_quantity: number;
  is_available: boolean;
  position: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name_fr: string;
  name_wo: string;
  slug: string;
  description_fr: string | null;
  description_wo: string | null;
  price: number | null;
  compare_at_price: number | null;
  sku: string | null;
  stock_quantity: number;
  track_inventory: boolean;
  low_stock_threshold: number;
  is_available: boolean;
  is_featured: boolean;
  is_published: boolean;
  video_url: string | null;
  seo_title_fr: string | null;
  seo_title_wo: string | null;
  seo_description_fr: string | null;
  seo_description_wo: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
};

export type DeliveryZone = {
  id: string;
  name: string;
  name_wo: string | null;
  description: string | null;
  description_wo: string | null;
  fee: number | null;
  estimated_delivery: string | null;
  estimated_delivery_wo: string | null;
  is_pickup: boolean;
  is_active: boolean;
  sort_order: number;
};

export type StoreSettings = {
  business_name: string;
  phone_display: string;
  phone_international: string;
  whatsapp_number: string;
  email: string | null;
  locations: string[];
  opening_hours_fr: string | null;
  opening_hours_wo: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  hero_video_url: string | null;
  announcement_enabled: boolean;
  announcement_fr: string[];
  announcement_wo: string[];
  seo_description_fr: string | null;
  seo_description_wo: string | null;
};

export type BlogPost = {
  id: string;
  slug: string;
  title_fr: string;
  title_wo: string | null;
  excerpt_fr: string | null;
  excerpt_wo: string | null;
  content_fr: string;
  content_wo: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

export type OrderStatus =
  | "pending"
  | "awaiting_confirmation"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "awaiting_confirmation",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

/** Résultat de public.quote_cart / private.compute_cart. */
export type QuoteIssue =
  | "not_found"
  | "unavailable"
  | "variant_required"
  | "invalid_quantity"
  | "out_of_stock"
  | "insufficient_stock";

export type QuoteLine = {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  name_fr: string | null;
  name_wo: string | null;
  slug: string | null;
  sku: string | null;
  variant_label: string | null;
  unit_price: number | null;
  line_total: number | null;
  image_url: string | null;
  track_inventory: boolean;
  available_quantity: number | null;
  issue: QuoteIssue | null;
};

export type CartQuote = {
  lines: QuoteLine[];
  priced_subtotal: number;
  subtotal: number | null;
  has_unpriced_items: boolean;
  has_issues: boolean;
  zone: { id: string; name: string; name_wo: string | null; fee: number | null; is_pickup: boolean } | null;
  delivery_fee: number | null;
  delivery_fee_status: "known" | "to_confirm";
  total: number | null;
  currency: "XOF";
};

/** Champs localisés : choisit la version wolof si elle existe. */
export function pick<T extends Record<string, unknown>>(
  record: T,
  field: string,
  locale: Locale,
): string {
  const wo = record[`${field}_wo`];
  const fr = record[`${field}_fr`];
  if (locale === "wo" && typeof wo === "string" && wo.trim()) return wo;
  return typeof fr === "string" ? fr : "";
}
