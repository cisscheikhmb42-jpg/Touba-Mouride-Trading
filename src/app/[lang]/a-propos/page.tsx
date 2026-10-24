import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, MapPin, MessageCircle, Truck } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo";
import { getCategories, getStoreSettings } from "@/lib/data/catalog";
import { pick } from "@/lib/types";
import { whatsappUrl } from "@/lib/whatsapp";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Reveal } from "@/components/ui/reveal";
import { WhatsAppIcon } from "@/components/ui/icons";
import { BagMark, StarFrieze } from "@/components/ui/ornament";

const VALUE_ICONS = [BadgeCheck, MessageCircle, Truck];

export async function generateMetadata({ params }: PageProps<"/[lang]/a-propos">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/a-propos", title: dict.aboutPage.title, description: dict.aboutPage.description });
}

export default async function AboutPage({ params }: PageProps<"/[lang]/a-propos">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const t = dict.aboutPage;
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="container-page grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.25fr_1fr] lg:py-20">
          <div>
            <Breadcrumbs
              label={dict.common.breadcrumb}
              items={[
                { label: dict.common.home, href: paths.home(locale) },
                { label: t.title, href: paths.about(locale) },
              ]}
            />
            <p className="eyebrow mt-8">{t.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-6xl">{t.heading}</h1>
            <StarFrieze className="mt-6" />
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{t.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={paths.shop(locale)} className="btn btn-primary">
                {t.ctaShop} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href={whatsappUrl(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon /> {dict.common.contactOnWhatsapp}
              </a>
            </div>
          </div>
          <Reveal className="mx-auto w-full max-w-sm">
            <div className="flex flex-col items-center rounded-[2.25rem] border border-line bg-gradient-to-b from-brand-50 to-white px-8 py-12 text-center shadow-[var(--shadow-lift)]">
              <Image src="/brand/logo-mark.png" alt={`Logo ${settings.business_name}`} width={236} height={293} className="h-40 w-auto sm:h-48" />
              <p className="mt-7 text-2xl font-extrabold tracking-[0.02em] uppercase">{settings.business_name}</p>
              <StarFrieze className="mt-4" count={4} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <Reveal>
          <h2 className="text-3xl font-extrabold sm:text-4xl">{t.offerTitle}</h2>
          <p className="mt-3 max-w-2xl text-muted">{t.offerText}</p>
        </Reveal>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link
                href={paths.category(locale, c.slug)}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-brand-500 hover:shadow-[var(--shadow-soft)]"
              >
                <span className="font-display text-2xl font-extrabold text-brand-500 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-display font-bold">{pick(c, "name", locale)}</span>
                <ArrowUpRight className="size-5 text-brand-700 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-ink text-white">
        <div className="container-page py-14 sm:py-20">
          <Reveal>
            <h2 className="text-3xl font-extrabold sm:text-4xl">{t.valuesTitle}</h2>
            <StarFrieze className="mt-5" count={4} />
          </Reveal>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {t.values.map((v, i) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
              return (
                <li key={v.title}>
                  <Reveal delay={i * 100} className="h-full rounded-3xl border border-white/10 bg-white/5 p-7">
                    <span className="grid size-12 place-items-center rounded-xl bg-brand-500 text-ink">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-xl font-extrabold">{v.title}</h3>
                    <p className="mt-2 leading-relaxed text-white/75">{v.text}</p>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <Reveal className="relative overflow-hidden rounded-[2.25rem] bg-brand-500 p-8 sm:p-12">
          <BagMark className="absolute -right-10 -bottom-14 h-52 w-44 opacity-10" tone="ink" />
          <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">{t.visitTitle}</h2>
          <ul className="relative mt-6 grid gap-3 sm:grid-cols-2">
            {settings.locations.map((l) => (
              <li key={l} className="flex items-center gap-3 rounded-2xl bg-white p-5 font-display text-lg font-bold">
                <MapPin className="size-5 shrink-0 text-brand-700" aria-hidden="true" /> {l}
              </li>
            ))}
          </ul>
          <p className="relative mt-6 max-w-xl text-ink">{t.visitText}</p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <a href={whatsappUrl(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn btn-dark">
              <WhatsAppIcon /> {dict.common.contactOnWhatsapp}
            </a>
            <Link href={paths.contact(locale)} className="btn border-[1.5px] border-ink text-ink hover:bg-white">
              {dict.common.contact}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
