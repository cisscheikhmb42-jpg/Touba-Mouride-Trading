import type { Product } from "@/lib/types";
import { buildSearchTerms, matchesSearch } from "@/lib/search";
import { displayPrice, isOrderable, variantStock } from "./product-utils";

export type SortKey = "nouveautes" | "prix-asc" | "prix-desc" | "nom";

export type CatalogFilters = {
  q: string;
  category: string;
  size: string;
  color: string;
  available: boolean;
  min: number | null;
  max: number | null;
  sort: SortKey;
};

const SORTS: SortKey[] = ["nouveautes", "prix-asc", "prix-desc", "nom"];

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.slice(0, 80).trim() ?? "";
}

function toInt(v: string): number | null {
  if (!/^\d{1,9}$/.test(v)) return null;
  return Number(v);
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const sort = first(sp.tri) as SortKey;
  return {
    q: first(sp.q),
    category: first(sp.categorie),
    size: first(sp.taille),
    color: first(sp.couleur),
    available: first(sp.dispo) === "1",
    min: toInt(first(sp.min)),
    max: toInt(first(sp.max)),
    sort: SORTS.includes(sort) ? sort : "nouveautes",
  };
}

export function hasActiveFilters(f: CatalogFilters): boolean {
  return !!(f.q || f.category || f.size || f.color || f.available || f.min !== null || f.max !== null || f.sort !== "nouveautes");
}

export function applyFilters(products: Product[], f: CatalogFilters, categoryIdBySlug: Map<string, string>): Product[] {
  const terms = buildSearchTerms(f.q);
  const categoryId = f.category ? categoryIdBySlug.get(f.category) : undefined;
  const result = products.filter((p) => {
    if (f.category && p.category_id !== categoryId) return false;
    if (!matchesSearch(p.search_text, terms)) return false;
    if (f.size && !p.product_variants.some((v) => v.size?.trim() === f.size && v.is_available)) return false;
    if (f.color && !p.product_variants.some((v) => v.color?.trim() === f.color && v.is_available)) return false;
    if (f.available && !isOrderable(variantStock(p, null))) return false;
    if (f.min !== null || f.max !== null) {
      // Les produits sans prix confirmé sont exclus d'un filtre de prix.
      const { amount } = displayPrice(p);
      if (amount === null) return false;
      if (f.min !== null && amount < f.min) return false;
      if (f.max !== null && amount > f.max) return false;
    }
    return true;
  });

  const priceOf = (p: Product) => displayPrice(p).amount;
  switch (f.sort) {
    case "prix-asc":
    case "prix-desc": {
      const dir = f.sort === "prix-asc" ? 1 : -1;
      // Prix à confirmer toujours en fin de liste.
      return result.sort((a, b) => {
        const pa = priceOf(a);
        const pb = priceOf(b);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return (pa - pb) * dir;
      });
    }
    case "nom":
      return result.sort((a, b) => a.name_fr.localeCompare(b.name_fr, "fr"));
    default:
      return result; // déjà triés par date d'ajout décroissante
  }
}
