import type { Category, Product } from "@/lib/types";
import { displayPrice } from "./product-utils";

/** Catégories principales (sans parente active) : menus, accueil, filtres. */
export function topLevel(categories: Category[]): Category[] {
  const ids = new Set(categories.map((c) => c.id));
  return categories.filter((c) => !c.parent_id || !ids.has(c.parent_id));
}

/** Sous-catégories directes d'une catégorie, dans l'ordre d'affichage. */
export function childrenOf(categories: Category[], id: string): Category[] {
  return categories.filter((c) => c.parent_id === id);
}

/** La catégorie et toutes ses sous-catégories (identifiants). */
export function withDescendants(categories: Category[], id: string): Set<string> {
  const ids = new Set([id]);
  let added = true;
  while (added) {
    added = false;
    for (const c of categories) {
      if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
        ids.add(c.id);
        added = true;
      }
    }
  }
  return ids;
}

/** Libellés d'administration : « Parente › Sous-catégorie », parentes d'abord. */
export function adminCategoryOptions<T extends { id: string; name_fr: string; parent_id: string | null }>(categories: T[]): { id: string; label: string }[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const out: { id: string; label: string }[] = [];
  for (const c of categories.filter((x) => !x.parent_id || !byId.has(x.parent_id))) {
    out.push({ id: c.id, label: c.name_fr });
    for (const child of categories.filter((x) => x.parent_id === c.id)) out.push({ id: child.id, label: `${c.name_fr} › ${child.name_fr}` });
  }
  return out;
}

/** Produits publiés d'une catégorie et de ses sous-catégories. */
export function productsIn(categories: Category[], products: Product[], id: string): Product[] {
  const ids = withDescendants(categories, id);
  return products.filter((p) => p.category_id && ids.has(p.category_id));
}

/** Photo de la catégorie : celle choisie dans l'admin, sinon la photo d'un de ses produits. */
export function categoryCover(categories: Category[], products: Product[], category: Category): string | null {
  if (category.image_url) return category.image_url;
  const withPhoto = productsIn(categories, products, category.id).filter((p) => p.product_images.length > 0);
  return withPhoto.at(-1)?.product_images[0].image_url ?? null; // le plus ancien produit avec photo
}

/** Plus petit prix confirmé parmi les produits de la catégorie (null si aucun). */
export function categoryMinPrice(categories: Category[], products: Product[], id: string): number | null {
  const prices = productsIn(categories, products, id)
    .map((p) => displayPrice(p).amount)
    .filter((a): a is number => a !== null);
  return prices.length ? Math.min(...prices) : null;
}
