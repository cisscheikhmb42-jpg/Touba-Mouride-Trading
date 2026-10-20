import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import type { Product } from "@/lib/types";
import { pick } from "@/lib/types";
import { displayPrice, isOrderable, variantStock } from "@/lib/data/product-utils";
import { Price } from "./price";
import { StockBadge } from "./stock-badge";
import { ImagePlaceholder } from "./image-placeholder";
import { QuickAddButton } from "./quick-add-button";

export function ProductCard({
  product,
  locale,
  dict,
  priority = false,
}: {
  product: Product;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
}) {
  const name = pick(product, "name", locale);
  const image = product.product_images[0];
  const price = displayPrice(product);
  const state = variantStock(product, null);
  const href = paths.product(locale, product.slug);
  const canQuickAdd = product.product_variants.length === 0 && isOrderable(state);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-paper" tabIndex={-1} aria-hidden="true">
        {image ? (
          <Image
            src={image.image_url}
            alt=""
            fill
            sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 78vw"
            quality={70}
            priority={priority}
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <ImagePlaceholder label={dict.product.photoComing} />
        )}
        {price.amount !== null && product.compare_at_price && product.compare_at_price > price.amount && (
          <span className="absolute top-3 left-3 rounded-full bg-ink px-2.5 py-1 text-[0.7rem] font-bold tracking-wide text-white uppercase">
            −{Math.round((1 - price.amount / product.compare_at_price) * 100)}%
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-[0.95rem] leading-snug font-bold text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {name}
          </Link>
        </h3>
        <Price
          amount={price.amount}
          compareAt={price.from ? null : product.compare_at_price}
          from={price.from}
          labels={{ toConfirm: dict.product.priceToConfirm, compareAt: dict.product.compareAt, from: dict.product.from }}
        />
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <StockBadge state={state} dict={dict} />
          {canQuickAdd ? (
            <QuickAddButton
              item={{
                productId: product.id,
                variantId: null,
                quantity: 1,
                snapshot: {
                  nameFr: product.name_fr,
                  nameWo: product.name_wo,
                  slug: product.slug,
                  imageUrl: image?.image_url ?? null,
                  unitPrice: product.price,
                  variantLabel: null,
                },
              }}
              label={`${dict.product.addToCart} : ${name}`}
            />
          ) : (
            <span className="relative z-10 text-xs font-bold text-brand-700">{dict.product.viewProduct} →</span>
          )}
        </div>
      </div>
    </article>
  );
}
