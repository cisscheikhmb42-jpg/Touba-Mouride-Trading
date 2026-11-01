/**
 * Photos livrées avec le site (dossier public/, ex. /produits/...) : déjà
 * optimisées en WebP, elles sont servies telles quelles, sans passer par
 * l'optimiseur d'images. Les photos envoyées depuis l'admin (Supabase) restent optimisées.
 */
export function isLocalImage(src: string | null | undefined): boolean {
  return typeof src === "string" && src.startsWith("/") && !src.startsWith("//");
}
