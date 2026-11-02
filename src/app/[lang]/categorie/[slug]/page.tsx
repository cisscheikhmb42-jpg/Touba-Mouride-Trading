import type { Metadata } from "next";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { format, isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import Image from "next/image";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/data/catalog";
import { categoryCover, categoryMinPrice, childrenOf, productsIn, topLevel } from "@/lib/data/categories";
import { formatFCFA } from "@/lib/format";
import { isLocalImage } from "@/lib/images";
import { pick, type Category } from "@/lib/types";
import { pageMetadata, truncate } from "@/lib/seo";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CatalogView } from "@/components/catalog/catalog-view";
import { GridSkeleton } from "@/components/catalog/product-grid";
import { StarFrieze } from "@/components/ui/ornament";

export async function generateStaticParams() {
  const categories = await getCategories();
  // Cache Components exige au moins une valeur : "_" mène à une 404.
  return categories.length ? categories.map((c) => ({ slug: c.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/categorie/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const category = await getCategoryBySlug(slug);
  if (!category) return { robots: { index: false } };
  const name = pick(category, "name", locale);
  return pageMetadata({
    locale,
    path: `/categorie/${category.slug}`,
    title: pick(category, "seo_title", locale) || name,
    description: truncate(pick(category, "seo_description", locale) || pick(category, "description", locale)),
    image: category.image_url,
  });
}

async function CategoryPageContent({ params, searchParams }: PageProps<"/[lang]/categorie/[slug]">) {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const [category, categories] = await Promise.all([getCategoryBySlug(slug), getCategories()]);
  if (!category) notFound();
  const name = pick(category, "name", locale);
  const description = pick(category, "description", locale);
  const parent = category.parent_id ? (categories.find((c) => c.id === category.parent_id) ?? null) : null;
  const others = topLevel(categories).filter((c) => c.id !== category.id && c.id !== parent?.id);
  // Navigation entre les parties : celles de la catégorie, ou celles de sa parente.
  const familyRoot = parent ?? category;
  const family = childrenOf(categories, familyRoot.id);

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.common.home, href: paths.home(locale) },
          { label: dict.catalog.title, href: paths.shop(locale) },
          ...(parent ? [{ label: pick(parent, "name", locale), href: paths.category(locale, parent.slug) }] : []),
          { label: name, href: paths.category(locale, category.slug) },
        ]}
      />
      <header className="mt-6 mb-8 max-w-3xl">
        <p className="eyebrow">{dict.catalog.category}</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">{name}</h1>
        <StarFrieze className="mt-5" />
        {description && <p className="mt-4 text-lg text-muted">{description}</p>}
      </header>
      {family.length > 0 && (
        <Suspense fallback={<div className="mb-8 h-[4.5rem]" aria-hidden="true" />}>
          <SubcategoryCards
            searchParams={searchParams}
            locale={locale}
            dict={dict}
            categories={categories}
            family={family}
            currentId={category.id}
            root={familyRoot}
          />
        </Suspense>
      )}
      <h2 className="sr-only">{format(dict.catalog.productsIn, { name })}</h2>
      <Suspense fallback={<GridSkeleton />}>
        <CatalogView
          searchParams={searchParams}
          locale={locale}
          dict={dict}
          action={paths.category(locale, category.slug)}
          categoryId={category.id}
        />
      </Suspense>
      {others.length > 0 && (
        <nav aria-labelledby="other-categories" className="mt-16 border-t border-line pt-10">
          <h2 id="other-categories" className="mb-5 text-xl font-extrabold">
            {dict.catalog.otherCategories}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((c) => (
              <li key={c.id}>
                <Link
                  href={paths.category(locale, c.slug)}
                  className="inline-block rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-brand-500"
                >
                  {pick(c, "name", locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

/**
 * Les parties d'une catégorie, en cartes avec photo et prix de départ.
 * Lit d'abord les paramètres d'URL : les produits sont chargés à la requête,
 * jamais figés dans la page prérendue au build.
 */
async function SubcategoryCards({
  searchParams,
  locale,
  dict,
  categories,
  family,
  currentId,
  root,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  family: Category[];
  currentId: string;
  root: Category;
}) {
  await searchParams;
  const products = await getProducts();
  const tabs = [
    { id: root.id, slug: root.slug, label: dict.catalog.allOfCategory, cover: categoryCover(categories, products, root), min: categoryMinPrice(categories, products, root.id), count: productsIn(categories, products, root.id).length },
    ...family.map((c) => ({
      id: c.id,
      slug: c.slug,
      label: pick(c, "name", locale),
      cover: categoryCover(categories, products, c),
      min: categoryMinPrice(categories, products, c.id),
      count: productsIn(categories, products, c.id).length,
    })),
  ];
  return (
    <nav aria-label={dict.catalog.subcategories} className="-mx-4 mb-8 px-4 sm:mx-0 sm:px-0">
      <ul className="scroller !gap-3 pb-1">
        {tabs.map((tab) => {
          const current = tab.id === currentId;
          return (
            <li key={tab.id} className="shrink-0">
              <Link
                href={paths.category(locale, tab.slug)}
                aria-current={current ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-2xl border p-2 pr-5 transition ${
                  current ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-brand-500"
                }`}
              >
                <span className="relative block size-14 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                  {tab.cover && (
                    <Image unoptimized={isLocalImage(tab.cover)} src={tab.cover} alt="" fill sizes="56px" quality={70} className="object-cover object-top" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm leading-tight font-extrabold whitespace-nowrap">{tab.label}</span>
                  <span className={`mt-1 block text-xs font-semibold whitespace-nowrap ${current ? "text-brand-200" : "text-brand-800"}`}>
                    {tab.min !== null ? `${dict.product.from} ${formatFCFA(tab.min)}` : format(dict.catalog.results, { n: tab.count })}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Les paramètres d'URL sont lus sous <Suspense> : pour une catégorie créée après
 * le déploiement, Next.js envoie aussitôt le squelette puis le contenu dans
 * la même réponse, et met la page en cache pour les visites suivantes.
 */
export default function CategoryPage(props: PageProps<"/[lang]/categorie/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CategoryPageContent {...props} />
    </Suspense>
  );
}
