/** Normalisation identique à private.normalize_search (sans accents, minuscules). */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Variantes d'écriture courantes. Permet de trouver « jallabe » en
 * tapant « djellaba », « khassaide » pour « xassaide », etc.
 * Complétez cette liste au fil des recherches des clients.
 */
const SYNONYMS: Record<string, string[]> = {
  jallabe: ["jalabe", "djellaba", "djelaba", "jellaba", "jallaba", "boubou"],
  xassaide: ["xassaides", "khassaide", "khassaides", "xasaid", "qasida", "khassida", "xassida"],
  chapelet: ["chapelets", "kurus", "tasbih", "misbaha"],
  parfum: ["parfums", "latigne", "musc", "huile", "attar"],
  chaussure: ["chaussures", "dall", "soulier", "sandale"],
  marakiss: ["marakis", "marakich", "babouche"],
  capuche: ["capuchon", "kaala"],
  orthopedique: ["orthopediques", "ortho"],
};

const REVERSE = new Map<string, string>();
for (const [canonical, variants] of Object.entries(SYNONYMS)) {
  REVERSE.set(canonical, canonical);
  for (const v of variants) REVERSE.set(v, canonical);
}

/** Découpe la requête en termes ; chaque terme accepte ses synonymes. */
export function buildSearchTerms(query: string): string[][] {
  return normalize(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2)
    .slice(0, 8)
    .map((term) => {
      const canonical = REVERSE.get(term);
      if (!canonical) return [term];
      return [canonical, ...SYNONYMS[canonical]];
    });
}

/** Tous les termes doivent correspondre (via l'un de leurs synonymes). */
export function matchesSearch(searchText: string, terms: string[][]): boolean {
  if (terms.length === 0) return true;
  return terms.every((alternatives) => alternatives.some((alt) => searchText.includes(alt)));
}

export function slugify(input: string): string {
  return normalize(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
