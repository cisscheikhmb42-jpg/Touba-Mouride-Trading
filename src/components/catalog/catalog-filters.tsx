"use client";

import { useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/i18n/client";
import type { CatalogFilters as Filters } from "@/lib/data/filter";

/**
 * Filtres en GET (URL partageable, fonctionne sans JavaScript). Avec
 * JavaScript, les listes déroulantes appliquent le filtre immédiatement.
 */
export function CatalogFilters({
  action,
  filters,
  categories,
  sizes,
  colors,
  showCategory,
  showPrice,
  resultsLabel,
  active,
}: {
  action: string;
  filters: Filters;
  resultsLabel: string;
  active: boolean;
  categories: { slug: string; name: string }[];
  sizes: string[];
  colors: string[];
  showCategory: boolean;
  showPrice: boolean;
}) {
  const { dict } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const t = dict.catalog;
  const autoSubmit = () => formRef.current?.requestSubmit();
  // Filtres du panneau (le tri reste visible dans la barre).
  const count = [filters.q, showCategory && filters.category, filters.size, filters.color, filters.available, filters.min !== null || filters.max !== null].filter(Boolean).length;

  return (
    <form
      ref={formRef}
      action={action}
      method="get"
      aria-label={t.filters}
      className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl border border-line bg-white p-2 sm:pl-4"
    >
      <p className="px-2 font-display text-sm font-bold sm:px-0">{resultsLabel}</p>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <label htmlFor="f-sort" className="sr-only">
          {t.sort}
        </label>
        <select id="f-sort" name="tri" defaultValue={filters.sort} onChange={autoSubmit} className="field !min-h-10 min-w-0 flex-1 !py-1.5 text-sm font-semibold sm:w-auto sm:flex-none">
          <option value="nouveautes">{t.sortNewest}</option>
          {showPrice && <option value="prix-asc">{t.sortPriceAsc}</option>}
          {showPrice && <option value="prix-desc">{t.sortPriceDesc}</option>}
          <option value="nom">{t.sortName}</option>
        </select>
        <details open={active && count > 0}>
          <summary className="btn btn-dark !min-h-10 cursor-pointer list-none !px-4 text-sm [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal className="size-4" aria-hidden="true" /> {t.filters}
            {count > 0 && <span className="rounded-md bg-brand-500 px-1.5 text-xs font-extrabold text-ink">{count}</span>}
          </summary>
          <div className="card absolute inset-x-0 top-full z-30 mt-2 p-5 shadow-[var(--shadow-lift)] sm:left-auto sm:w-[26rem]">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="f-q" className="field-label">
            {t.searchLabel}
          </label>
          <input id="f-q" name="q" type="search" defaultValue={filters.q} maxLength={80} placeholder={t.searchPlaceholder} className="field" />
        </div>
        {showCategory && categories.length > 0 && (
          <div>
            <label htmlFor="f-cat" className="field-label">
              {t.category}
            </label>
            <select id="f-cat" name="categorie" defaultValue={filters.category} onChange={autoSubmit} className="field">
              <option value="">{t.all}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {sizes.length > 0 && (
          <div>
            <label htmlFor="f-size" className="field-label">
              {t.size}
            </label>
            <select id="f-size" name="taille" defaultValue={filters.size} onChange={autoSubmit} className="field">
              <option value="">{t.all}</option>
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        {colors.length > 0 && (
          <div>
            <label htmlFor="f-color" className="field-label">
              {t.color}
            </label>
            <select id="f-color" name="couleur" defaultValue={filters.color} onChange={autoSubmit} className="field">
              <option value="">{t.all}</option>
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        {showPrice && (
          <fieldset>
            <legend className="field-label">{t.price}</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="sr-only" htmlFor="f-min">
                {t.priceMin}
              </label>
              <input id="f-min" name="min" inputMode="numeric" pattern="[0-9]*" placeholder={t.priceMin} defaultValue={filters.min ?? ""} className="field" />
              <label className="sr-only" htmlFor="f-max">
                {t.priceMax}
              </label>
              <input id="f-max" name="max" inputMode="numeric" pattern="[0-9]*" placeholder={t.priceMax} defaultValue={filters.max ?? ""} className="field" />
            </div>
          </fieldset>
        )}
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium sm:col-span-2">
          <input
            type="checkbox"
            name="dispo"
            value="1"
            defaultChecked={filters.available}
            onChange={autoSubmit}
            className="size-5 rounded accent-brand-700"
          />
          {t.onlyAvailable}
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="submit" className="btn btn-dark flex-1">
          {t.apply}
        </button>
        <a href={action} className="btn btn-outline">
          {t.resetFilters}
        </a>
      </div>
          </div>
        </details>
      </div>
    </form>
  );
}
