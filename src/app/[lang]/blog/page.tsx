import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { format, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { getBlogPosts } from "@/lib/data/catalog";
import { pick } from "@/lib/types";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { StarFrieze } from "@/components/ui/ornament";

export async function generateMetadata({ params }: PageProps<"/[lang]/blog">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const posts = await getBlogPosts();
  // Pas d'indexation d'une page vide.
  return pageMetadata({ locale, path: "/blog", title: dict.blog.title, description: dict.blog.description, noindex: posts.length === 0 });
}

export default async function BlogPage({ params }: PageProps<"/[lang]/blog">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const posts = await getBlogPosts();
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.common.home, href: paths.home(locale) },
          { label: dict.blog.title, href: paths.blog(locale) },
        ]}
      />
      <h1 className="mt-6 text-3xl font-extrabold sm:text-5xl">{dict.blog.title}</h1>
      <StarFrieze className="mt-5" />
      <p className="mt-4 text-lg text-muted">{dict.blog.description}</p>
      {posts.length === 0 ? (
        <p className="card mt-10 p-8 text-center text-muted">{dict.blog.empty}</p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id} className="card overflow-hidden">
              <Link href={paths.blogPost(locale, post.slug)} className="group block">
                {post.cover_image_url && (
                  <div className="relative aspect-[16/10] bg-paper">
                    <Image src={post.cover_image_url} alt="" fill sizes="(min-width: 1024px) 31vw, 100vw" quality={70} className="object-cover" />
                  </div>
                )}
                <div className="p-5">
                  {post.published_at && (
                    <p className="text-xs text-muted">{format(dict.blog.publishedOn, { date: formatDate(post.published_at, locale) })}</p>
                  )}
                  <h2 className="mt-2 font-display text-lg font-extrabold group-hover:underline">{pick(post, "title", locale)}</h2>
                  {pick(post, "excerpt", locale) && <p className="mt-2 text-sm text-muted">{pick(post, "excerpt", locale)}</p>}
                  <span className="mt-4 inline-block text-sm font-bold text-brand-700">{dict.blog.readMore} →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
