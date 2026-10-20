/**
 * Langues du site. Pour ajouter l'anglais : ajouter "en" ici, créer
 * dictionaries/en.ts (même structure que fr.ts) et l'enregistrer dans
 * dictionaries/index.ts. Les champs produits *_en pourront être ajoutés
 * en base de la même façon que *_wo.
 */
export const locales = ["fr", "wo"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const LOCALE_COOKIE = "tmt_lang";

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  wo: "Wolof",
};

/** Codes hreflang / Open Graph. */
export const localeTags: Record<Locale, { hreflang: string; og: string; html: string }> = {
  fr: { hreflang: "fr-SN", og: "fr_SN", html: "fr" },
  wo: { hreflang: "wo-SN", og: "wo_SN", html: "wo" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Remplace {cle} par sa valeur. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}
