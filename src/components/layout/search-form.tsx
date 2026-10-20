"use client";

import { Search } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { paths } from "@/i18n/paths";

/** Formulaire GET : fonctionne aussi sans JavaScript. */
export function SearchForm({ id, className = "", autoFocus = false }: { id: string; className?: string; autoFocus?: boolean }) {
  const { locale, dict } = useI18n();
  return (
    <form action={paths.shop(locale)} method="get" role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        {dict.catalog.searchLabel}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        autoFocus={autoFocus}
        placeholder={dict.catalog.searchPlaceholder}
        maxLength={80}
        enterKeyHint="search"
        className="h-11 w-full rounded-full border border-line bg-paper pr-12 pl-4 text-[0.95rem] text-ink placeholder:text-muted focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-500/20 focus:outline-none"
      />
      <button
        type="submit"
        aria-label={dict.common.search}
        className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-ink text-white transition hover:bg-ink-soft"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
