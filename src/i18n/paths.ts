import type { Locale } from "./config";

/** Construction centralisée des URL localisées. */
export const paths = {
  home: (l: Locale) => `/${l}`,
  shop: (l: Locale) => `/${l}/boutique`,
  category: (l: Locale, slug: string) => `/${l}/categorie/${slug}`,
  product: (l: Locale, slug: string) => `/${l}/produit/${slug}`,
  cart: (l: Locale) => `/${l}/panier`,
  contact: (l: Locale) => `/${l}/contact`,
  faq: (l: Locale) => `/${l}/faq`,
  delivery: (l: Locale) => `/${l}/livraison-et-retours`,
  privacy: (l: Locale) => `/${l}/confidentialite`,
  terms: (l: Locale) => `/${l}/conditions-generales-de-vente`,
  blog: (l: Locale) => `/${l}/blog`,
  blogPost: (l: Locale, slug: string) => `/${l}/blog/${slug}`,
};

/** Remplace le préfixe de langue d'un chemin. */
export function switchLocalePath(pathname: string, to: Locale): string {
  const parts = pathname.split("/");
  if (parts[1] === "fr" || parts[1] === "wo") {
    parts[1] = to;
    return parts.join("/") || `/${to}`;
  }
  return `/${to}${pathname === "/" ? "" : pathname}`;
}
