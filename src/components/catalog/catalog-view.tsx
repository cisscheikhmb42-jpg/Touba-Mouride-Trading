import { SearchX } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getCategories, getProducts, getStoreSettings } from "@/lib/data/catalog";
import { applyFilters, parseFilters } from "@/lib/data/filter";
import { uniqueValues } from "@/lib/data/product-utils";
import { pick } from "@/lib/types";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";
import { CatalogFilters } from "./catalog-filters";
import { ProductGrid } from "./product-grid";

/**
 * Liste filtrable. Lit les paramètres d'URL (dynamique, sous Suspense) ;
 * les produits viennent du cache du catalogue.
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
  const scope = categoryId ? allProducts.filter((p) => p.category_id === categoryId) : allProducts;
  const results = applyFilters(scope, categoryId ? { ...filters, category: "" } : filters, new Map(categories.map((c) => [c.slug, c.id])));
  const showPrice = scope.some((p) => p.price !== null || p.product_variants.some((v) => v.price !== null));

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-10">
      <aside className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
        <CatalogFilters
          action={action}
          filters={filters}
          categories={categories.map((c) => ({ slug: c.slug, name: pick(c, "name", locale) }))}
          sizes={uniqueValues(scope, "size")}
          colors={uniqueValues(scope, "color")}
          showCategory={!categoryId}
          showPrice={showPrice}
        />
      </aside>
      <section aria-live="polite">
        <p className="mb-4 text-sm font-medium text-muted">
          {filters.q ? `${format(dict.catalog.searchResultsFor, { q: filters.q })} · ` : ""}
          {format(dict.catalog.results, { n: results.length })}
        </p>
        {results.length > 0 ? (
          <ProductGrid products={results} locale={locale} dict={dict} />
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
