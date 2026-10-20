import type { Metadata } from "next";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { format, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { getCategories, getCategoryBySlug } from "@/lib/data/catalog";
import { pick } from "@/lib/types";
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
  const others = categories.filter((c) => c.id !== category.id);

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.common.home, href: paths.home(locale) },
          { label: dict.catalog.title, href: paths.shop(locale) },
          { label: name, href: paths.category(locale, category.slug) },
        ]}
      />
      <header className="mt-6 mb-8 max-w-3xl">
        <p className="eyebrow">{dict.catalog.category}</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">{name}</h1>
        <StarFrieze className="mt-5" />
        {description && <p className="mt-4 text-lg text-muted">{description}</p>}
      </header>
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
