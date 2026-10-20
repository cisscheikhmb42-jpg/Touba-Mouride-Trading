import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getDeliveryZones } from "@/lib/data/catalog";
import { pageMetadata } from "@/lib/seo";
import { CartView } from "@/components/cart/cart-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/panier">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  return pageMetadata({ locale, path: "/panier", title: getDictionary(locale).cart.title, noindex: true });
}

export default async function CartPage({ params }: PageProps<"/[lang]/panier">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const zones = await getDeliveryZones();
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-8 text-3xl font-extrabold sm:text-5xl">{dict.cart.title}</h1>
      <CartView zones={zones} />
    </div>
  );
}
