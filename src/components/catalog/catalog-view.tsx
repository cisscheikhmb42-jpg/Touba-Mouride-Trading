import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { getCategories, getProducts, getStoreSettings } from "@/lib/data/catalog";
import { childrenOf, topLevel, withDescendants } from "@/lib/data/categories";
import { applyFilters, hasActiveFilters, parseFilters } from "@/lib/data/filter";
import { displayPrice, uniqueValues } from "@/lib/data/product-utils";
import { formatFCFA } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { pick } from "@/lib/types";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";
import { CatalogFilters } from "./catalog-filters";
import { ProductGrid } from "./product-grid";

type Section = { id: string; name: string; href: string | null; products: Product[] };

/** « 70 000 FCFA » si tous les prix sont identiques, sinon « Dès … ». */
function priceSummary(products: Product[], dict: Dictionary): string | null {
  const prices = products.map((p) => displayPrice(p).amount).filter((a): a is number => a !== null);
  if (!prices.length) return null;
  const min = Math.min(...prices);
  const same = prices.length === products.length && prices.every((p) => p === min);
  return same ? formatFCFA(min) : `${dict.product.from} ${formatFCFA(min)}`;
}

/**
 * Liste filtrable. Lit les paramètres d'URL (dynamique, sous Suspense) ;
 * les produits viennent du cache du catalogue.
 * Sans filtre actif, les articles sont rangés par partie (sous-catégorie)
 * ou, dans la boutique, par catégorie.
 */
export async function CatalogView({
  searchParams,
  locale,
  dict,
  action,
  categoryId,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  locale: Locale;
  dict: Dictionary;
  action: string;
  categoryId?: string;
}) {
  // Lire d'abord les paramètres d'URL : les données ne sont ainsi chargées
  // qu'à la requête, jamais figées dans la page prérendue au build.
  const sp = await searchParams;
  const [allProducts, categories, settings] = await Promise.all([getProducts(), getCategories(), getStoreSettings()]);
  const filters = parseFilters(sp);
  const active = hasActiveFilters(categoryId ? { ...filters, category: "" } : filters);
  const inScope = categoryId ? withDescendants(categories, categoryId) : null;
  const scope = inScope ? allProducts.filter((p) => p.category_id && inScope.has(p.category_id)) : allProducts;
  const idsBySlug = new Map(categories.map((c) => [c.slug, withDescendants(categories, c.id)]));
  const results = applyFilters(scope, categoryId ? { ...filters, category: "" } : filters, idsBySlug);
  const current = categoryId ? (categories.find((c) => c.id === categoryId) ?? null) : null;

  const sectionOf = (c: Category): Section => {
    const ids = withDescendants(categories, c.id);
    return {
      id: c.id,
      name: pick(c, "name", locale),
      href: paths.category(locale, c.slug),
      products: results.filter((p) => p.category_id && ids.has(p.category_id)),
    };
  };
  // Catégorie avec parties : une section par partie. Boutique sans filtre : une section par catégorie.
  const groups = categoryId ? childrenOf(categories, categoryId) : active ? [] : topLevel(categories);
  const sections: Section[] | null = groups.length
    ? [
        ...groups.map(sectionOf),
        {
          id: "other",
          name: dict.catalog.otherProducts,
          href: null,
          products: categoryId
            ? results.filter((p) => p.category_id === categoryId)
            : results.filter((p) => !p.category_id || !categories.some((c) => c.id === p.category_id)),
        },
      ].filter((s) => s.products.length > 0)
    : null;
  const showPrice = scope.some((p) => p.price !== null || p.product_variants.some((v) => v.price !== null));

  return (
    <div>
      <CatalogFilters
        action={action}
        filters={filters}
        resultsLabel={format(dict.catalog.results, { n: results.length })}
        active={active}
        categories={topLevel(categories).map((c) => ({ slug: c.slug, name: pick(c, "name", locale) }))}
        sizes={uniqueValues(scope, "size")}
        colors={uniqueValues(scope, "color")}
        showCategory={!categoryId}
        showPrice={showPrice}
      />
      <section aria-live="polite" className="mt-6">
        {filters.q && <p className="mb-4 text-sm font-medium text-muted">{format(dict.catalog.searchResultsFor, { q: filters.q })}</p>}
        {results.length > 0 && sections ? (
          <div className="space-y-14">
            {sections.map((s) => {
              const summary = priceSummary(s.products, dict);
              return (
                <section key={s.id} aria-labelledby={`section-${s.id}`}>
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line pb-4">
                    <div>
                      <h3 id={`section-${s.id}`} className="text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">
                        {s.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {format(dict.catalog.results, { n: s.products.length })}
                        {summary && (
                          <>
                            {" · "}
                            <span className="font-bold text-brand-800">{summary}</span>
                          </>
                        )}
                      </p>
                    </div>
                    {s.href && (
                      <Link href={s.href} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
                        {dict.common.viewAll} <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                  <ProductGrid products={s.products} locale={locale} dict={dict} stripPrefix={categoryId && s.href ? s.name : undefined} />
                </section>
              );
            })}
          </div>
        ) : results.length > 0 ? (
          <ProductGrid products={results} locale={locale} dict={dict} stripPrefix={current ? pick(current, "name", locale) : undefined} />
        ) : (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <SearchX className="size-10 text-brand-700" aria-hidden="true" />
            <p className="mt-4 font-display text-lg font-bold">
              {scope.length === 0 && categoryId ? dict.catalog.emptyCategory : dict.catalog.noResults}
            </p>
            <p className="mt-2 max-w-md text-sm text-muted">{dict.catalog.noResultsHelp}</p>
            <a
              href={whatsappUrl(settings.whatsapp_number, filters.q ? `${dict.catalog.searchLabel} : ${filters.q}` : undefined)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp mt-6"
            >
              <WhatsAppIcon /> {dict.common.contactOnWhatsapp}
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
