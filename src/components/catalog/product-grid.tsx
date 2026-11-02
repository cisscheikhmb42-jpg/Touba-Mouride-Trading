import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

const GRID = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4";

/** stripPrefix : nom de la partie affichée au-dessus, retiré des noms d'articles. */
export function ProductGrid({
  products,
  locale,
  dict,
  stripPrefix,
}: {
  products: Product[];
  locale: Locale;
  dict: Dictionary;
  stripPrefix?: string;
}) {
  return (
    <ul className={GRID}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} locale={locale} dict={dict} priority={i < 2} stripPrefix={stripPrefix} />
        </li>
      ))}
    </ul>
  );
}

export function GridSkeleton() {
  return (
    <ul className={GRID} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
          <div className="skeleton aspect-[4/5]" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}
