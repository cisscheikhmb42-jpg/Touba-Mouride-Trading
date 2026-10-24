import type { MetadataRoute } from "next";
import { locales, localeTags } from "@/i18n/config";
import { SITE_URL } from "@/lib/env";
import { getBlogPosts, getCategories, getProducts } from "@/lib/data/catalog";

/** Uniquement les pages à indexer (pas le panier, l'admin ni les filtres). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, posts] = await Promise.all([getCategories(), getProducts(), getBlogPosts()]);

  const entry = (path: string, lastModified?: string, priority = 0.5): MetadataRoute.Sitemap =>
    locales.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      ...(lastModified ? { lastModified } : {}),
      priority,
      alternates: {
        languages: Object.fromEntries(locales.map((x) => [localeTags[x].hreflang, `${SITE_URL}/${x}${path}`])),
      },
    }));

  return [
    ...entry("", undefined, 1),
    ...entry("/boutique", undefined, 0.9),
    ...categories.flatMap((c) => entry(`/categorie/${c.slug}`, c.updated_at, 0.8)),
    ...products.flatMap((p) => entry(`/produit/${p.slug}`, p.updated_at, 0.7)),
    ...entry("/a-propos", undefined, 0.5),
    ...entry("/faq", undefined, 0.4),
    ...entry("/contact", undefined, 0.4),
    ...entry("/livraison-et-retours", undefined, 0.3),
    ...entry("/conditions-generales-de-vente", undefined, 0.2),
    ...entry("/confidentialite", undefined, 0.2),
    ...(posts.length ? entry("/blog", undefined, 0.5) : []),
    ...posts.flatMap((p) => entry(`/blog/${p.slug}`, p.updated_at, 0.5)),
  ];
}
