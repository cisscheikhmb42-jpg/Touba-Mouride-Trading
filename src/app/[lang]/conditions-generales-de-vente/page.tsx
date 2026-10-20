import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo";
import { terms } from "@/content/legal";
import { LegalPage } from "@/components/content/legal-page";

export async function generateMetadata({ params }: PageProps<"/[lang]/conditions-generales-de-vente">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  return pageMetadata({ locale, path: "/conditions-generales-de-vente", title: getDictionary(locale).legal.termsTitle });
}

export default async function TermsPage({ params }: PageProps<"/[lang]/conditions-generales-de-vente">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  return <LegalPage locale={locale} dict={dict} title={dict.legal.termsTitle} href={paths.terms(locale)} sections={terms} />;
}
