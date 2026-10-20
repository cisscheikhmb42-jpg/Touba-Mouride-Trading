import type { Metadata } from "next";
import { locales, localeTags, type Locale } from "@/i18n/config";
import { SITE_URL } from "@/lib/env";

/**
 * Métadonnées d'une page localisée : canonical, hreflang (fr-SN, wo-SN,
 * x-default), Open Graph. `path` est le chemin SANS préfixe de langue.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  noindex = false,
  type = "website",
}: {
  locale: Locale;
  path: string;
  title?: string;
  description?: string;
  image?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const clean = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeTags[l].hreflang] = `${SITE_URL}/${l}${clean}`;
  languages["x-default"] = `${SITE_URL}/fr${clean}`;
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: `${SITE_URL}/${locale}${clean}`, languages },
    openGraph: {
      type,
      url: `${SITE_URL}/${locale}${clean}`,
      locale: localeTags[locale].og,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeTags[l].og),
      siteName: "TOUBA MOURIDE TRADING",
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function truncate(text: string | null | undefined, max = 158): string | undefined {
  if (!text) return undefined;
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
