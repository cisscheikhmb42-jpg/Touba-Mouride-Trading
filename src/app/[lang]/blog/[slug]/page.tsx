import type { Metadata } from "next";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { pageMetadata, truncate } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/data/catalog";
import { pick } from "@/lib/types";
import { SITE_URL } from "@/lib/env";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}


export async function generateMetadata({ params }: PageProps<"/[lang]/blog/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const post = await getBlogPostBySlug(slug);
  if (!post) return { robots: { index: false } };
  return pageMetadata({
    locale,
    path: `/blog/${post.slug}`,
    title: pick(post, "title", locale),
    description: truncate(pick(post, "excerpt", locale) || pick(post, "content", locale)),
    image: post.cover_image_url,
    type: "article",
  });
}

async function BlogPostPageContent({ params }: PageProps<"/[lang]/blog/[slug]">) {
  const { lang, slug } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();
  const title = pick(post, "title", locale);
  const content = pick(post, "content", locale);
  return (
    <article className="container-page max-w-3xl py-8 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          ...(post.published_at ? { datePublished: post.published_at } : {}),
          dateModified: post.updated_at,
          ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
          author: { "@type": "Organization", name: "TOUBA MOURIDE TRADING" },
          mainEntityOfPage: `${SITE_URL}${paths.blogPost(locale, post.slug)}`,
        }}
      />
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.common.home, href: paths.home(locale) },
          { label: dict.blog.title, href: paths.blog(locale) },
          { label: title, href: paths.blogPost(locale, post.slug) },
        ]}
      />
      <h1 className="mt-6 text-3xl leading-tight font-extrabold sm:text-5xl">{title}</h1>
      {post.published_at && (
        <p className="mt-3 text-sm text-muted">{format(dict.blog.publishedOn, { date: formatDate(post.published_at, locale) })}</p>
      )}
      {post.cover_image_url && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] bg-paper">
          <Image src={post.cover_image_url} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" quality={85} className="object-cover" />
        </div>
      )}
      <div className="prose-shop mt-8 text-lg whitespace-pre-line">{content}</div>
    </article>
  );
}

/**
 * Les paramètres d'URL sont lus sous <Suspense> : pour un article créé après
 * le déploiement, Next.js envoie aussitôt le squelette puis le contenu dans
 * la même réponse, et met la page en cache pour les visites suivantes.
 */
export default function BlogPostPage(props: PageProps<"/[lang]/blog/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BlogPostPageContent {...props} />
    </Suspense>
  );
}
