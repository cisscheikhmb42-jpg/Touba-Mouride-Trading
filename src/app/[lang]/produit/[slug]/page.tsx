import type { Metadata } from "next";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { format, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { getCategories, getProductBySlug, getProducts, getStoreSettings } from "@/lib/data/catalog";

import { pick, type Product } from "@/lib/types";
import { pageMetadata, truncate } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { whatsappUrl } from "@/lib/whatsapp";
import { Breadcrumbs, type Crumb } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { PurchasePanel } from "@/components/catalog/purchase-panel";
import { ProductCard } from "@/components/catalog/product-card";
import { Carousel } from "@/components/ui/carousel";
import { StarFrieze } from "@/components/ui/ornament";

export async function generateStaticParams() {
  const products = await getProducts();
  // Cache Components exige au moins une valeur : "_" mène à une 404.
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/produit/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const product = await getProductBySlug(slug);
  if (!product) return { robots: { index: false } };
  const name = pick(product, "name", locale);
  return pageMetadata({
    locale,
    path: `/produit/${product.slug}`,
    title: pick(product, "seo_title", locale) || name,
    description: truncate(pick(product, "seo_description", locale) || pick(product, "description", locale) || name),
    image: product.product_images[0]?.image_url,
  });
}

function productJsonLd(product: Product, locale: Locale, categoryName: string | null) {
  const url = `${SITE_URL}${paths.product(locale, product.slug)}`;
  const known = [product.price, ...product.product_variants.map((v) => v.price ?? product.price)].filter(
    (p): p is number => p !== null,
  );
  // Disponibilité publiée uniquement si elle est réellement connue.
  let availability: string | undefined;
  if (!product.is_available) availability = "https://schema.org/OutOfStock";
  else if (product.track_inventory) {
    const qty = product.product_variants.length
      ? product.product_variants.filter((v) => v.is_available).reduce((s, v) => s + v.stock_quantity, 0)
      : product.stock_quantity;
    availability = qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  }
  const base = { priceCurrency: "XOF", url, ...(availability ? { availability } : {}) };
  let offers: Record<string, unknown> | undefined;
  if (known.length > 0) {
    const low = Math.min(...known);
    const high = Math.max(...known);
    offers =
      low === high && (product.product_variants.length === 0 || product.product_variants.every((v) => (v.price ?? product.price) !== null))
        ? { "@type": "Offer", price: String(low), ...base }
        : { "@type": "AggregateOffer", lowPrice: String(low), highPrice: String(high), offerCount: known.length, ...base };
  }
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pick(product, "name", locale),
    ...(pick(product, "description", locale) ? { description: pick(product, "description", locale) } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.product_images.length ? { image: product.product_images.map((i) => i.image_url) } : {}),
    ...(categoryName ? { category: categoryName } : {}),
    brand: { "@type": "Brand", name: "TOUBA MOURIDE TRADING" },
    url,
    ...(offers ? { offers } : {}),
  };
}

async function ProductPageContent({ params }: PageProps<"/[lang]/produit/[slug]">) {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const [product, products, categories, settings] = await Promise.all([
    getProductBySlug(slug),
    getProducts(),
    getCategories(),
    getStoreSettings(),
  ]);
  if (!product) notFound();

  const name = pick(product, "name", locale);
  const description = pick(product, "description", locale);
  const category = categories.find((c) => c.id === product.category_id) ?? null;
  const categoryName = category ? pick(category, "name", locale) : null;
  const similar = products.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 10);
  const productUrl = `${SITE_URL}${paths.product(locale, product.slug)}`;
  const infoHref = whatsappUrl(settings.whatsapp_number, format(dict.product.whatsappProductMessage, { name, url: productUrl }));

  const crumbs: Crumb[] = [
    { label: dict.common.home, href: paths.home(locale) },
    { label: dict.catalog.title, href: paths.shop(locale) },
    ...(category && categoryName ? [{ label: categoryName, href: paths.category(locale, category.slug) }] : []),
    { label: name, href: paths.product(locale, product.slug) },
  ];

  const gallery = product.product_images.map((img, i) => ({
    id: img.id,
    url: img.image_url,
    alt: (locale === "wo" ? img.alt_text_wo || img.alt_text_fr : img.alt_text_fr) || `${name}${i ? ` — ${i + 1}` : ""}`,
  }));

  return (
    <div className="container-page py-8 sm:py-12">
      <JsonLd data={productJsonLd(product, locale, categoryName)} />
      <Breadcrumbs label={dict.common.breadcrumb} items={crumbs} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={gallery} />
        <div className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
          {categoryName && <p className="eyebrow">{categoryName}</p>}
          <h1 className="mt-2 text-3xl leading-tight font-extrabold sm:text-4xl">{name}</h1>
          <StarFrieze className="mt-4" count={3} />
          {product.sku && (
            <p className="mt-3 text-xs text-muted">
              {dict.product.sku} : {product.sku}
            </p>
          )}
          <div className="mt-6">
            <PurchasePanel product={product} infoHref={infoHref} />
          </div>
          <div className="mt-8 flex gap-3 rounded-2xl border border-line bg-white p-4">
            <Truck className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
            <div>
              <h2 className="font-display text-sm font-bold">{dict.product.deliveryTitle}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{dict.product.deliveryText}</p>
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="product-description" className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 id="product-description" className="text-2xl font-extrabold">
            {dict.product.description}
          </h2>
          <div className="prose-shop mt-4 whitespace-pre-line">{description || dict.product.noDescription}</div>
        </div>
        {product.video_url && (
          <div>
            <h2 className="text-2xl font-extrabold">{dict.product.video}</h2>
            <video
              src={product.video_url}
              controls
              playsInline
              preload="none"
              className="mt-4 aspect-video w-full rounded-[var(--radius-card)] bg-ink"
              aria-label={`${dict.product.video} — ${name}`}
            />
          </div>
        )}
      </section>

      {similar.length > 0 && (
        <section aria-labelledby="similar" className="mt-16">
          <h2 id="similar" className="mb-6 text-2xl font-extrabold">
            {dict.product.similar}
          </h2>
          <Carousel label={dict.product.similar}>
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} dict={dict} />
            ))}
          </Carousel>
        </section>
      )}
    </div>
  );
}


/**
 * Les paramètres d'URL sont lus sous <Suspense> : pour un produit créé après
 * le déploiement, Next.js envoie aussitôt le squelette puis le contenu dans
 * la même réponse, et met la page en cache pour les visites suivantes.
 */
export default function ProductPage(props: PageProps<"/[lang]/produit/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}
