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
}: {
  action: string;
  filters: Filters;
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

  return (
    <form ref={formRef} action={action} method="get" className="card p-4 sm:p-5" aria-label={t.filters}>
      <div className="mb-4 flex items-center gap-2 font-display text-sm font-bold">
        <SlidersHorizontal className="size-4" aria-hidden="true" /> {t.filters}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="sm:col-span-2 lg:col-span-1">
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
        <div>
          <label htmlFor="f-sort" className="field-label">
            {t.sort}
          </label>
          <select id="f-sort" name="tri" defaultValue={filters.sort} onChange={autoSubmit} className="field">
            <option value="nouveautes">{t.sortNewest}</option>
            {showPrice && <option value="prix-asc">{t.sortPriceAsc}</option>}
            {showPrice && <option value="prix-desc">{t.sortPriceDesc}</option>}
            <option value="nom">{t.sortName}</option>
          </select>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
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
    </form>
  );
}
