import type { Product, ProductVariant } from "@/lib/types";

export type StockState =
  | { kind: "unavailable" }
  | { kind: "out_of_stock" }
  | { kind: "low"; quantity: number }
  | { kind: "in_stock" }
  /** Stock non suivi : disponibilité déclarée par la boutique. */
  | { kind: "available" };

export function variantStock(product: Product, variant: ProductVariant | null): StockState {
  if (!product.is_available || (variant && !variant.is_available)) return { kind: "unavailable" };
  if (!product.track_inventory) return { kind: "available" };
  const qty = variant
    ? variant.stock_quantity
    : product.product_variants.length > 0
      ? product.product_variants.filter((v) => v.is_available).reduce((s, v) => s + v.stock_quantity, 0)
      : product.stock_quantity;
  if (qty <= 0) return { kind: "out_of_stock" };
  if (qty <= product.low_stock_threshold) return { kind: "low", quantity: qty };
  return { kind: "in_stock" };
}

export function isOrderable(state: StockState): boolean {
  return state.kind !== "unavailable" && state.kind !== "out_of_stock";
}

/** Prix « à partir de » : min des prix connus (variantes ou produit). */
export function displayPrice(product: Product): { amount: number | null; from: boolean } {
  const prices = product.product_variants
    .filter((v) => v.is_available)
    .map((v) => v.price ?? product.price)
    .filter((p): p is number => p !== null);
  if (product.product_variants.length === 0 || prices.length === 0) {
    return { amount: product.price, from: false };
  }
  const min = Math.min(...prices);
  return { amount: min, from: new Set(prices).size > 1 };
}

export function uniqueValues(products: Product[], key: "size" | "color"): string[] {
  const set = new Set<string>();
  for (const p of products)
    for (const v of p.product_variants) {
      const value = v[key]?.trim();
      if (value) set.add(value);
    }
  return [...set].sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
}
