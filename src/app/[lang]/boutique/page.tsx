import type { Metadata } from "next";
import { Suspense } from "react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CatalogView } from "@/components/catalog/catalog-view";
import { GridSkeleton } from "@/components/catalog/product-grid";

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/boutique">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const sp = await searchParams;
  // Les pages filtrées ne sont pas indexées (canonical vers la boutique).
  const filtered = Object.keys(sp).length > 0;
  return pageMetadata({
    locale,
    path: "/boutique",
    title: dict.catalog.title,
    description: dict.meta.description,
    noindex: filtered,
  });
}

export default async function ShopPage({ params, searchParams }: PageProps<"/[lang]/boutique">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.common.home, href: paths.home(locale) },
          { label: dict.catalog.title, href: paths.shop(locale) },
        ]}
      />
      <header className="mt-6 mb-8">
        <h1 className="text-3xl font-extrabold sm:text-5xl">{dict.catalog.title}</h1>
        <p className="mt-3 text-muted">{dict.catalog.subtitle}</p>
      </header>
      <Suspense fallback={<GridSkeleton />}>
        <CatalogView searchParams={searchParams} locale={locale} dict={dict} action={paths.shop(locale)} />
      </Suspense>
    </div>
  );
}
