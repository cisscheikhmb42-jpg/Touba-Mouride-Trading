import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { inter, montserrat } from "../fonts";
import { isLocale, localeTags, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/client";
import { CartProvider } from "@/components/cart/cart-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StoreProvider } from "@/components/layout/store-context";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { getCategories, getStoreSettings } from "@/lib/data/catalog";
import { SITE_URL } from "@/lib/env";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const settings = await getStoreSettings();
  const description =
    (locale === "wo" ? settings.seo_description_wo : settings.seo_description_fr) || dict.meta.description;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.defaultTitle, template: dict.meta.titleTemplate },
    description,
    applicationName: settings.business_name,
    formatDetection: { telephone: false },
    icons: { icon: "/icon.svg" },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);

  return (
    <html lang={localeTags[lang].html} className={`${montserrat.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#contenu"
          className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {dict.common.skipToContent}
        </a>
        <I18nProvider locale={lang} dict={dict}>
          <StoreProvider value={{ whatsappNumber: settings.whatsapp_number }}>
            <CartProvider>
              <SiteHeader locale={lang} dict={dict} settings={settings} categories={categories} />
              <main id="contenu" className="flex-1">
                {children}
              </main>
              <SiteFooter locale={lang} dict={dict} settings={settings} categories={categories} />
              <WhatsAppFloat />
            </CartProvider>
          </StoreProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
