import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FaqList, faqJsonLd } from "@/components/ui/faq-list";
import { JsonLd } from "@/components/seo/json-ld";
import { StarFrieze } from "@/components/ui/ornament";

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/faq", title: dict.faq.title, description: dict.faq.description });
}

export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <JsonLd data={faqJsonLd(dict.faq.items)} />
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.common.home, href: paths.home(locale) },
          { label: dict.faq.title, href: paths.faq(locale) },
        ]}
      />
      <h1 className="mt-6 text-3xl font-extrabold sm:text-5xl">{dict.faq.title}</h1>
      <StarFrieze className="mt-5" />
      <p className="mt-4 text-lg text-muted">{dict.faq.description}</p>
      <div className="mt-8">
        <FaqList items={dict.faq.items} />
      </div>
    </div>
  );
}
