import type { Metadata } from "next";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { format, isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
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
        <Suspense fallback={<div className="mb-10 h-64" aria-hidden="true" />}>
          <SubcategoryCards
            searchParams={searchParams}
            locale={locale}
            dict={dict}
            categories={categories}
            family={family}
            currentId={category.id}
            parentSlug={parent?.slug ?? null}
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
                  className="inline-block rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-ink"
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
  parentSlug,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  family: Category[];
  currentId: string;
  parentSlug: string | null;
}) {
  await searchParams;
  const products = await getProducts();
  return (
    <nav aria-label={dict.catalog.subcategories} className="-mt-2 mb-10">
      {parentSlug && (
        <Link href={paths.category(locale, parentSlug)} className="mb-4 inline-block rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold transition hover:border-brand-500">
          {dict.catalog.allOfCategory}
        </Link>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {family.map((c) => {
          const current = c.id === currentId;
          const cover = categoryCover(categories, products, c);
          const min = categoryMinPrice(categories, products, c.id);
          const count = productsIn(categories, products, c.id).length;
          return (
            <li key={c.id}>
              <Link
                href={paths.category(locale, c.slug)}
                aria-current={current ? "page" : undefined}
                className={`group block overflow-hidden rounded-[1.5rem] border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${
                  current ? "border-ink ring-2 ring-ink" : "border-line"
                }`}
              >
                <span className="relative block aspect-[4/3] bg-brand-50">
                  {cover && (
                    <Image
                      unoptimized={isLocalImage(cover)}
                      src={cover}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 28vw, 50vw"
                      quality={70}
                      className="object-cover object-top transition duration-700 group-hover:scale-105"
                    />
                  )}
                </span>
                <span className="flex items-end justify-between gap-3 p-4 sm:p-5">
                  <span className="min-w-0">
                    <span className="block font-display text-base leading-tight font-extrabold sm:text-lg">{pick(c, "name", locale)}</span>
                    <span className="mt-1.5 block text-sm font-semibold text-brand-800">
                      {min !== null ? `${dict.product.from} ${formatFCFA(min)}` : format(dict.catalog.results, { n: count })}
                    </span>
                  </span>
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-white transition group-hover:bg-brand-700">
                    <ArrowUpRight className="size-4" />
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
