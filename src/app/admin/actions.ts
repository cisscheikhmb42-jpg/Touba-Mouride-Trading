"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { amount, bool, dbError, int, optStr, str, type ActionState } from "@/lib/admin/form";
import { TAGS } from "@/lib/data/catalog";
import { slugify } from "@/lib/search";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

/*
 * Toutes les actions : 1) vérifient le rôle administrateur côté serveur,
 * 2) valident les données, 3) écrivent avec la session de l'utilisateur
 * (les politiques RLS s'appliquent), 4) invalident le cache public.
 */

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ok = (message: string): ActionState => {
  refresh(); // réaffiche la page d'administration avec les données à jour
  return { ok: true, message };
};
const fail = (message: string): ActionState => ({ ok: false, message });

function refreshCatalog() {
  updateTag(TAGS.catalog);
}

// ---------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------
export async function signOut() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------
// Produits
// ---------------------------------------------------------------------
export async function saveProduct(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = optStr(fd, "id");
  const nameFr = str(fd, "name_fr");
  if (nameFr.length < 1 || nameFr.length > 160) return fail("Le nom en français est obligatoire (160 caractères max).");
  const slug = str(fd, "slug") || slugify(nameFr);
  if (!SLUG.test(slug)) return fail("Slug invalide : lettres minuscules, chiffres et tirets uniquement.");

  const price = amount(fd, "price");
  const compareAt = amount(fd, "compare_at_price");
  if (price === "invalid" || compareAt === "invalid") return fail("Les prix doivent être des nombres entiers en FCFA.");
  if (compareAt !== null && (price === null || compareAt <= price))
    return fail("Le prix barré doit être supérieur au prix actuel (et un prix doit être renseigné).");
  const stock = int(fd, "stock_quantity");
  const threshold = int(fd, "low_stock_threshold", 3);
  if (stock === "invalid" || stock < 0) return fail("Le stock doit être un nombre entier positif ou nul.");
  if (threshold === "invalid" || threshold < 0) return fail("Le seuil d'alerte doit être un nombre entier positif.");

  const record = {
    name_fr: nameFr,
    name_wo: str(fd, "name_wo") || nameFr,
    slug,
    category_id: optStr(fd, "category_id"),
    description_fr: optStr(fd, "description_fr"),
    description_wo: optStr(fd, "description_wo"),
    price,
    compare_at_price: compareAt,
    sku: optStr(fd, "sku"),
    stock_quantity: stock,
    track_inventory: bool(fd, "track_inventory"),
    low_stock_threshold: threshold,
    is_available: bool(fd, "is_available"),
    is_featured: bool(fd, "is_featured"),
    is_published: bool(fd, "is_published"),
    video_url: optStr(fd, "video_url"),
    seo_title_fr: optStr(fd, "seo_title_fr"),
    seo_title_wo: optStr(fd, "seo_title_wo"),
    seo_description_fr: optStr(fd, "seo_description_fr"),
    seo_description_wo: optStr(fd, "seo_description_wo"),
  };

  if (record.video_url && !/^https:\/\//.test(record.video_url)) return fail("L'URL de la vidéo doit commencer par https://");

  if (id) {
    const { error } = await supabase.from("products").update(record).eq("id", id);
    if (error) return fail(dbError(error));
    refreshCatalog();
    return ok("Produit enregistré.");
  }
  const { data, error } = await supabase.from("products").insert(record).select("id").single();
  if (error) return fail(dbError(error));
  refreshCatalog();
  redirect(`/admin/produits/${data.id}?cree=1`);
}

export async function deleteProduct(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  const paths = (images ?? []).map((i) => i.storage_path).filter((p): p is string => !!p);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(dbError(error));
  if (paths.length) await supabase.storage.from("media").remove(paths);
  refreshCatalog();
  redirect("/admin/produits?supprime=1");
}

// ---------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------
export async function saveVariant(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = optStr(fd, "id");
  const productId = str(fd, "product_id");
  const size = optStr(fd, "size");
  const color = optStr(fd, "color");
  if (!size && !color) return fail("Indiquez au moins une taille/pointure ou une couleur.");
  const price = amount(fd, "price");
  const stock = int(fd, "stock_quantity");
  const position = int(fd, "position");
  if (price === "invalid") return fail("Prix invalide (nombre entier en FCFA).");
  if (stock === "invalid" || stock < 0) return fail("Stock invalide.");
  const record = {
    product_id: productId,
    size,
    color,
    sku: optStr(fd, "sku"),
    price,
    stock_quantity: stock,
    is_available: bool(fd, "is_available"),
    position: position === "invalid" ? 0 : position,
  };
  const { error } = id
    ? await supabase.from("product_variants").update(record).eq("id", id)
    : await supabase.from("product_variants").insert(record);
  if (error) return fail(dbError(error));
  refreshCatalog();
  return ok(id ? "Variante enregistrée." : "Variante ajoutée.");
}

export async function deleteVariant(fd: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("product_variants").delete().eq("id", str(fd, "id"));
  if (error) throw new Error(dbError(error));
  refreshCatalog();
  refresh();
}

// ---------------------------------------------------------------------
// Images (le fichier est envoyé dans Storage par le navigateur ; ici on
// enregistre sa référence)
// ---------------------------------------------------------------------
export async function addProductImage(input: {
  productId: string;
  imageUrl: string;
  storagePath: string;
  width: number | null;
  height: number | null;
  altFr: string | null;
}): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!input.storagePath.startsWith(`products/${input.productId}/`)) return fail("Chemin de fichier invalide.");
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", input.productId);
  const { error } = await supabase.from("product_images").insert({
    product_id: input.productId,
    image_url: input.imageUrl,
    storage_path: input.storagePath,
    width: input.width,
    height: input.height,
    alt_text_fr: input.altFr,
    position: count ?? 0,
  });
  if (error) {
    await supabase.storage.from("media").remove([input.storagePath]);
    return fail(dbError(error));
  }
  refreshCatalog();
  return ok("Photo ajoutée.");
}

export async function updateImage(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("product_images")
    .update({ alt_text_fr: optStr(fd, "alt_text_fr"), alt_text_wo: optStr(fd, "alt_text_wo") })
    .eq("id", str(fd, "id"));
  if (error) return fail(dbError(error));
  refreshCatalog();
  return ok("Texte alternatif enregistré.");
}

export async function moveImage(fd: FormData) {
  const { supabase } = await requireAdmin();
  const productId = str(fd, "product_id");
  const id = str(fd, "id");
  const dir = str(fd, "dir") === "up" ? -1 : 1;
  const { data } = await supabase
    .from("product_images")
    .select("id, position")
    .eq("product_id", productId)
    .order("position")
    .order("created_at");
  const list = data ?? [];
  const i = list.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  for (let k = 0; k < list.length; k++) {
    await supabase.from("product_images").update({ position: k }).eq("id", list[k].id);
  }
  refreshCatalog();
  refresh();
}

export async function deleteImage(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const { data } = await supabase.from("product_images").select("storage_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("product_images").delete().eq("id", id);
  if (error) throw new Error(dbError(error));
  if (data?.storage_path) await supabase.storage.from("media").remove([data.storage_path]);
  refreshCatalog();
  refresh();
}

// ---------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------
export async function saveCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = optStr(fd, "id");
  const nameFr = str(fd, "name_fr");
  if (!nameFr) return fail("Le nom est obligatoire.");
  const slug = str(fd, "slug") || slugify(nameFr);
  if (!SLUG.test(slug)) return fail("Slug invalide.");
  const sort = int(fd, "sort_order");
  const record = {
    name_fr: nameFr,
    name_wo: str(fd, "name_wo") || nameFr,
    slug,
    description_fr: optStr(fd, "description_fr"),
    description_wo: optStr(fd, "description_wo"),
    seo_title_fr: optStr(fd, "seo_title_fr"),
    seo_title_wo: optStr(fd, "seo_title_wo"),
    seo_description_fr: optStr(fd, "seo_description_fr"),
    seo_description_wo: optStr(fd, "seo_description_wo"),
    is_active: bool(fd, "is_active"),
    sort_order: sort === "invalid" ? 0 : sort,
  };
  const { error } = id
    ? await supabase.from("categories").update(record).eq("id", id)
    : await supabase.from("categories").insert(record);
  if (error) return fail(dbError(error));
  refreshCatalog();
  return ok(id ? "Catégorie enregistrée." : "Catégorie créée.");
}

export async function setCategoryImage(id: string, imageUrl: string | null, storagePath: string | null): Promise<ActionState> {
  const input = { id, imageUrl, storagePath };
  const { supabase } = await requireAdmin();
  const { data: previous } = await supabase.from("categories").select("image_storage_path").eq("id", input.id).maybeSingle();
  const { error } = await supabase
    .from("categories")
    .update({ image_url: input.imageUrl, image_storage_path: input.storagePath })
    .eq("id", input.id);
  if (error) return fail(dbError(error));
  if (previous?.image_storage_path && previous.image_storage_path !== input.storagePath) {
    await supabase.storage.from("media").remove([previous.image_storage_path]);
  }
  refreshCatalog();
  return ok("Image de catégorie enregistrée.");
}

export async function deleteCategory(fd: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", str(fd, "id"));
  if (error) throw new Error(dbError(error));
  refreshCatalog();
  refresh();
}

// ---------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------
export async function updateOrderStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const status = str(fd, "status") as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return fail("Statut inconnu.");
  const { error } = await supabase.rpc("admin_update_order_status", { p_order_id: str(fd, "id"), p_status: status });
  if (error) return fail(dbError(error));
  // Le stock a pu changer : rafraîchir le catalogue public.
  refreshCatalog();
  return ok("Statut mis à jour.");
}

export async function setOrderDeliveryFee(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const fee = amount(fd, "delivery_fee");
  if (fee === "invalid") return fail("Montant invalide.");
  const { error } = await supabase.rpc("admin_set_order_delivery_fee", { p_order_id: str(fd, "id"), p_fee: fee });
  if (error) return fail(dbError(error));
  return ok("Frais de livraison enregistrés.");
}

export async function saveOrderNotes(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("orders")
    .update({ internal_notes: optStr(fd, "internal_notes") })
    .eq("id", str(fd, "id"));
  if (error) return fail(dbError(error));
  return ok("Notes enregistrées.");
}

// ---------------------------------------------------------------------
// Zones de livraison
// ---------------------------------------------------------------------
export async function saveZone(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = optStr(fd, "id");
  const name = str(fd, "name");
  if (!name) return fail("Le nom de la zone est obligatoire.");
  const fee = amount(fd, "fee");
  if (fee === "invalid") return fail("Frais invalides (nombre entier en FCFA, ou vide = à confirmer).");
  const sort = int(fd, "sort_order");
  const record = {
    name,
    name_wo: optStr(fd, "name_wo"),
    description: optStr(fd, "description"),
    description_wo: optStr(fd, "description_wo"),
    fee,
    estimated_delivery: optStr(fd, "estimated_delivery"),
    estimated_delivery_wo: optStr(fd, "estimated_delivery_wo"),
    is_pickup: bool(fd, "is_pickup"),
    is_active: bool(fd, "is_active"),
    sort_order: sort === "invalid" ? 0 : sort,
  };
  const { error } = id
    ? await supabase.from("delivery_zones").update(record).eq("id", id)
    : await supabase.from("delivery_zones").insert(record);
  if (error) return fail(dbError(error));
  updateTag(TAGS.delivery);
  return ok(id ? "Zone enregistrée." : "Zone ajoutée.");
}

export async function deleteZone(fd: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("delivery_zones").delete().eq("id", str(fd, "id"));
  if (error) throw new Error(dbError(error));
  updateTag(TAGS.delivery);
  refresh();
}

// ---------------------------------------------------------------------
// Paramètres de la boutique
// ---------------------------------------------------------------------
// Les médias (logo, héro) sont gérés séparément par setSettingsMedia.
const URL_FIELDS = ["instagram_url", "tiktok_url", "facebook_url", "youtube_url"] as const;

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const whatsapp = str(fd, "whatsapp_number").replace(/[^0-9]/g, "");
  if (!/^[0-9]{8,15}$/.test(whatsapp)) return fail("Numéro WhatsApp invalide (format international sans +, ex. 221770941231).");
  const lines = (key: string) =>
    str(fd, key)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 10);
  const record: Record<string, unknown> = {
    business_name: str(fd, "business_name") || "TOUBA MOURIDE TRADING",
    phone_display: str(fd, "phone_display"),
    phone_international: str(fd, "phone_international"),
    whatsapp_number: whatsapp,
    email: optStr(fd, "email"),
    locations: lines("locations"),
    opening_hours_fr: optStr(fd, "opening_hours_fr"),
    opening_hours_wo: optStr(fd, "opening_hours_wo"),
    announcement_enabled: bool(fd, "announcement_enabled"),
    announcement_fr: lines("announcement_fr"),
    announcement_wo: lines("announcement_wo"),
    seo_description_fr: optStr(fd, "seo_description_fr"),
    seo_description_wo: optStr(fd, "seo_description_wo"),
  };
  for (const key of URL_FIELDS) {
    const v = optStr(fd, key);
    if (v && !/^https?:\/\//.test(v)) return fail(`Lien invalide pour « ${key} » : il doit commencer par https://`);
    record[key] = v;
  }
  const { error } = await supabase.from("store_settings").update(record).eq("id", 1);
  if (error) return fail(dbError(error));
  updateTag(TAGS.settings);
  return ok("Paramètres enregistrés.");
}

export async function setSettingsMedia(
  field: "logo_url" | "hero_image_url" | "hero_video_url",
  url: string | null,
): Promise<ActionState> {
  const input = { field, url };
  const { supabase } = await requireAdmin();
  if (!["logo_url", "hero_image_url", "hero_video_url"].includes(input.field)) return fail("Champ invalide.");
  const { error } = await supabase.from("store_settings").update({ [input.field]: input.url }).eq("id", 1);
  if (error) return fail(dbError(error));
  updateTag(TAGS.settings);
  return ok("Fichier enregistré.");
}

// ---------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------
export async function saveBlogPost(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = optStr(fd, "id");
  const title = str(fd, "title_fr");
  if (!title) return fail("Le titre est obligatoire.");
  const slug = str(fd, "slug") || slugify(title);
  if (!SLUG.test(slug)) return fail("Slug invalide.");
  const published = bool(fd, "is_published");
  const cover = optStr(fd, "cover_image_url");
  if (cover && !/^https?:\/\//.test(cover)) return fail("L'image de couverture doit être une URL https://");
  const record = {
    slug,
    title_fr: title,
    title_wo: optStr(fd, "title_wo"),
    excerpt_fr: optStr(fd, "excerpt_fr"),
    excerpt_wo: optStr(fd, "excerpt_wo"),
    content_fr: str(fd, "content_fr"),
    content_wo: optStr(fd, "content_wo"),
    cover_image_url: cover,
    is_published: published,
    published_at: published ? optStr(fd, "published_at") || new Date().toISOString() : null,
  };
  if (id) {
    const { error } = await supabase.from("blog_posts").update(record).eq("id", id);
    if (error) return fail(dbError(error));
    updateTag(TAGS.blog);
    return ok("Article enregistré.");
  }
  const { data, error } = await supabase.from("blog_posts").insert(record).select("id").single();
  if (error) return fail(dbError(error));
  updateTag(TAGS.blog);
  redirect(`/admin/blog/${data.id}`);
}

export async function deleteBlogPost(fd: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("blog_posts").delete().eq("id", str(fd, "id"));
  if (error) throw new Error(dbError(error));
  updateTag(TAGS.blog);
  redirect("/admin/blog");
}

// ---------------------------------------------------------------------
// Assistant IA (facultatif) : brouillon de description à relire
// ---------------------------------------------------------------------
export async function aiDraftDescription(productId: string, notes: string): Promise<{ ok: boolean; message: string; text?: string }> {
  const { supabase, user } = await requireAdmin();
  const { draftProductDescription } = await import("@/lib/ai");
  const { data: product } = await supabase
    .from("products")
    .select("name_fr, categories(name_fr), product_variants(size, color)")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { ok: false, message: "Produit introuvable." };
  const p = product as unknown as { name_fr: string; categories: { name_fr: string } | null; product_variants: { size: string | null; color: string | null }[] };
  const res = await draftProductDescription(user.id, {
    name: p.name_fr,
    category: p.categories?.name_fr ?? null,
    variants: p.product_variants.map((v) => [v.size, v.color].filter(Boolean).join(" / ")),
    notes: String(notes ?? ""),
  });
  return res.ok ? { ok: true, message: "Proposition générée : relisez-la avant de l'utiliser.", text: res.text } : { ok: false, message: res.message };
}
