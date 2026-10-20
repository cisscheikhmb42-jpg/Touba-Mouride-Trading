import type { Locale } from "../config";
import fr, { type Dictionary } from "./fr";
import wo from "./wo";

const dictionaries: Record<Locale, Dictionary> = { fr, wo };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? fr;
}

export type { Dictionary };
