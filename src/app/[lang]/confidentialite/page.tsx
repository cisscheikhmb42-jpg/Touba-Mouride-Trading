import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo";
import { privacy } from "@/content/legal";
import { LegalPage } from "@/components/content/legal-page";

export async function generateMetadata({ params }: PageProps<"/[lang]/confidentialite">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  return pageMetadata({ locale, path: "/confidentialite", title: getDictionary(locale).legal.privacyTitle });
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/confidentialite">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  return <LegalPage locale={locale} dict={dict} title={dict.legal.privacyTitle} href={paths.privacy(locale)} sections={privacy} />;
}
