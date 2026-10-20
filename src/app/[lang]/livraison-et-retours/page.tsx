import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo";
import { formatFCFA } from "@/lib/format";
import { getDeliveryZones } from "@/lib/data/catalog";
import { deliveryIntro } from "@/content/legal";
import { LegalPage } from "@/components/content/legal-page";

export async function generateMetadata({ params }: PageProps<"/[lang]/livraison-et-retours">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  return pageMetadata({ locale, path: "/livraison-et-retours", title: getDictionary(locale).legal.deliveryTitle });
}

export default async function DeliveryPage({ params }: PageProps<"/[lang]/livraison-et-retours">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const zones = await getDeliveryZones();
  return (
    <LegalPage locale={locale} dict={dict} title={dict.legal.deliveryTitle} href={paths.delivery(locale)} sections={deliveryIntro}>
      {zones.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-extrabold">{dict.legal.deliveryZonesTitle}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {zones.map((z) => {
              const delay = locale === "wo" ? z.estimated_delivery_wo || z.estimated_delivery : z.estimated_delivery;
              return (
                <li key={z.id} className="card p-5">
                  <h3 className="font-display font-bold">{locale === "wo" && z.name_wo ? z.name_wo : z.name}</h3>
                  {(locale === "wo" ? z.description_wo || z.description : z.description) && (
                    <p className="mt-1 text-sm text-muted">{locale === "wo" ? z.description_wo || z.description : z.description}</p>
                  )}
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">{dict.legal.feeLabel}</dt>
                      <dd className="font-semibold">{z.fee !== null ? formatFCFA(z.fee) : dict.legal.toConfirm}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">{dict.legal.delayLabel}</dt>
                      <dd className="font-semibold">{delay || dict.legal.toConfirm}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </LegalPage>
  );
}
