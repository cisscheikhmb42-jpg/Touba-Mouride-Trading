import type { Category } from "@/lib/types";

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
