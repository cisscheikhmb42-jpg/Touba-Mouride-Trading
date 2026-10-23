import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Mail, MapPin, MessageCircle, Phone, Truck } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { getCategories, getProducts, getStoreSettings } from "@/lib/data/catalog";
import { pick } from "@/lib/types";
import { whatsappUrl } from "@/lib/whatsapp";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { Carousel } from "@/components/ui/carousel";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { FaqList } from "@/components/ui/faq-list";
import { BagMark, StarFrieze } from "@/components/ui/ornament";
import { WhatsAppIcon } from "@/components/ui/icons";
import { CategoryTile } from "@/components/catalog/category-tile";
import { ProductCard } from "@/components/catalog/product-card";
import { JsonLd } from "@/components/seo/json-ld";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  return {
    ...pageMetadata({ locale, path: "/", description: dict.meta.description }),
    title: { absolute: dict.meta.defaultTitle },
  };
}

const TRUST_ICONS = [MessageCircle, BadgeCheck, Truck];

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const [settings, categories, products] = await Promise.all([getStoreSettings(), getCategories(), getProducts()]);

  const featured = products.filter((p) => p.is_featured).slice(0, 12);
  const latest = products.slice(0, 12); // déjà triés par date d'ajout décroissante
  const wa = whatsappUrl(settings.whatsapp_number);
  const editorialImages = products.flatMap((p) => p.product_images.slice(0, 1).map((img) => ({ img, p }))).slice(0, 2);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Store",
            "@id": `${SITE_URL}/#organization`,
            name: settings.business_name,
            url: `${SITE_URL}/${locale}`,
            telephone: settings.phone_international,
            ...(settings.email ? { email: settings.email } : {}),
            ...(settings.logo_url ? { logo: settings.logo_url } : {}),
            areaServed: { "@type": "Country", name: "Sénégal" },
            sameAs: [settings.instagram_url, settings.tiktok_url, settings.facebook_url].filter(Boolean),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: settings.business_name,
            url: `${SITE_URL}/${locale}`,
            inLanguage: locale === "wo" ? "wo" : "fr",
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/${locale}/boutique?q={search_term_string}` },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />

      {/* HÉRO */}
      <section className="relative overflow-hidden bg-white">
        {/* Halo turquoise très doux, rappel de la couleur du sac du logo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-[-10rem] size-[38rem] rounded-full bg-brand-100/60 blur-3xl"
        />
        <div className="container-page relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-24">
          <div>
            <p className="eyebrow">{dict.hero.eyebrow}</p>
            <h1 className="mt-5 text-[2.5rem] leading-[1.04] font-extrabold tracking-[-0.025em] text-ink sm:text-[3.4rem] lg:text-[4rem]">
              {dict.hero.title}
            </h1>
            <StarFrieze count={5} className="mt-7" />
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">{dict.hero.subtitle}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={paths.shop(locale)} className="btn btn-primary px-7">
                {dict.hero.ctaShop} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline px-7">
                <WhatsAppIcon className="size-5" /> {dict.hero.ctaWhatsapp}
              </a>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink-soft">
              {settings.locations.map((loc) => (
                <li key={loc} className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-brand-700" aria-hidden="true" /> {loc}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual
            image={settings.hero_image_url}
            alt={settings.business_name}
            name={settings.business_name}
            locations={settings.locations}
            categories={categories.slice(0, 6).map((c) => pick(c, "name", locale))}
          />
        </div>
      </section>

      {/* ENGAGEMENTS (uniquement des informations vraies) */}
      <section aria-label={dict.home.brandEyebrow} className="border-y border-line bg-white">
        <ul className="container-page grid divide-line sm:grid-cols-3 sm:divide-x">
          {dict.home.trust.map((item, i) => {
            const Icon = TRUST_ICONS[i] ?? BadgeCheck;
            return (
              <li key={item.title} className="flex gap-4 py-7 sm:px-6 sm:first:pl-0">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-500 text-ink">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[0.95rem] font-extrabold">{item.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{item.text}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* CATÉGORIES */}
      {categories.length > 0 && (
        <section aria-labelledby="home-categories" className="container-page py-20 sm:py-24">
          <Reveal>
            <SectionHeading
              id="home-categories"
              title={dict.home.categoriesTitle}
              subtitle={dict.home.categoriesSubtitle}
              action={{ href: paths.shop(locale), label: dict.common.viewAll }}
            />
            <Carousel label={dict.home.categoriesTitle} itemClassName="w-[62%] sm:w-[36%] lg:w-[23.5%] xl:w-[19%]">
              {categories.map((c, i) => (
                <CategoryTile key={c.id} category={c} locale={locale} index={i} />
              ))}
            </Carousel>
          </Reveal>
        </section>
      )}

      {/* PRODUITS */}
      {products.length === 0 ? (
        <section className="container-page pb-20 sm:pb-24">
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white px-6 py-14 text-center sm:px-12">
            <BagMark className="mx-auto h-16 w-14" />
            <h2 className="mt-6 text-2xl font-extrabold sm:text-3xl">{dict.home.emptyCatalogTitle}</h2>
            <StarFrieze className="mx-auto mt-4" count={3} />
            <p className="mx-auto mt-4 max-w-xl text-muted">{dict.home.emptyCatalogText}</p>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-8">
              <WhatsAppIcon /> {dict.common.contactOnWhatsapp}
            </a>
          </div>
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <section aria-labelledby="home-featured" className="container-page pb-20 sm:pb-24">
              <Reveal>
                <SectionHeading
                  id="home-featured"
                  title={dict.home.featuredTitle}
                  subtitle={dict.home.featuredSubtitle}
                  action={{ href: paths.shop(locale), label: dict.common.viewAll }}
                />
                <Carousel label={dict.home.featuredTitle}>
                  {featured.map((p) => (
                    <ProductCard key={p.id} product={p} locale={locale} dict={dict} />
                  ))}
                </Carousel>
              </Reveal>
            </section>
          )}
          <section aria-labelledby="home-latest" className="container-page pb-20 sm:pb-24">
            <Reveal>
              <SectionHeading
                id="home-latest"
                title={dict.home.latestTitle}
                subtitle={dict.home.latestSubtitle}
                action={{ href: paths.shop(locale), label: dict.common.viewAll }}
              />
              <Carousel label={dict.home.latestTitle}>
                {latest.map((p) => (
                  <ProductCard key={p.id} product={p} locale={locale} dict={dict} />
                ))}
              </Carousel>
            </Reveal>
          </section>
        </>
      )}

      {/* ÉDITORIAL */}
      <section className="bg-white py-20 sm:py-28">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal className="grid grid-cols-2 gap-4">
            {settings.hero_video_url ? (
              <video
                className="col-span-2 aspect-video w-full rounded-[1.75rem] bg-ink object-cover"
                src={settings.hero_video_url}
                controls
                muted
                playsInline
                preload="none"
                aria-label={dict.product.video}
              />
            ) : editorialImages.length > 0 ? (
              editorialImages.map(({ img, p }, i) => (
                <Link
                  key={img.id}
                  href={paths.product(locale, p.slug)}
                  className={`relative overflow-hidden rounded-[1.75rem] bg-paper ${
                    editorialImages.length === 1 ? "col-span-2 aspect-[4/3]" : i === 0 ? "aspect-[3/4]" : "mt-12 aspect-[3/4]"
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={(locale === "wo" ? img.alt_text_wo : img.alt_text_fr) || pick(p, "name", locale)}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    quality={70}
                    className="object-cover transition duration-700 hover:scale-[1.03]"
                  />
                </Link>
              ))
            ) : (
              <div className="col-span-2 grid aspect-[16/11] place-items-center rounded-[1.75rem] bg-brand-500">
                <div className="text-center">
                  <BagMark className="mx-auto h-28 w-24" tone="ink" />
                  <p className="mt-6 text-2xl font-extrabold tracking-wide text-ink uppercase">{settings.business_name}</p>
                  <StarFrieze className="mx-auto mt-4" count={4} />
                </div>
              </div>
            )}
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow">{dict.home.brandEyebrow}</p>
            <h2 className="mt-4 text-3xl leading-tight font-extrabold tracking-[-0.02em] sm:text-[2.6rem]">
              {dict.home.editorialTitle}
            </h2>
            <StarFrieze className="mt-6" count={4} />
            <p className="mt-6 text-lg leading-relaxed text-muted">{dict.home.editorialText}</p>
            <Link href={paths.shop(locale)} className="btn btn-dark mt-9 px-7">
              {dict.home.editorialCta} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* COMMENT COMMANDER */}
      <section aria-labelledby="home-how" className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading id="home-how" eyebrow="WhatsApp" title={dict.home.howTitle} />
          </Reveal>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dict.home.howSteps.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 90} className="group relative rounded-[1.5rem] border border-line bg-white p-7 transition hover:-translate-y-1 hover:border-brand-500 hover:shadow-[var(--shadow-lift)]">
                <span className="grid size-12 place-items-center rounded-2xl bg-ink text-lg font-extrabold text-white transition group-hover:bg-brand-500 group-hover:text-ink">
                  {i + 1}
                </span>
                <h3 className="mt-6 text-lg font-extrabold">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* LA BOUTIQUE + CONTACT */}
      <section className="container-page pb-20 sm:pb-28">
        <div className="grid overflow-hidden rounded-[2rem] bg-brand-500 lg:grid-cols-[1.2fr_1fr]">
          <Reveal className="relative p-8 sm:p-12 lg:p-14">
            <BagMark className="absolute -right-12 -bottom-16 h-52 w-44 opacity-10" tone="ink" />
            <p className="text-xs font-bold tracking-[0.2em] text-ink/80 uppercase">{dict.home.brandEyebrow}</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] text-ink sm:text-4xl">{dict.home.brandTitle}</h2>
            <StarFrieze className="mt-5" count={4} tone="ink" />
            <p className="relative mt-6 max-w-2xl text-lg leading-relaxed text-ink">{dict.home.brandText}</p>
          </Reveal>
          <Reveal delay={120} className="bg-ink p-8 text-white sm:p-12 lg:p-14">
            <h3 className="text-xl font-extrabold">{dict.home.contactTitle}</h3>
            <p className="mt-2 text-sm text-white/70">{dict.home.contactText}</p>
            <ul className="mt-7 space-y-4 text-[0.95rem]">
              <li>
                <a href={`tel:${settings.phone_international}`} className="flex items-center gap-3 hover:text-brand-300">
                  <Phone className="size-5 text-brand-400" aria-hidden="true" /> {settings.phone_display}
                </a>
              </li>
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="flex items-center gap-3 break-all hover:text-brand-300">
                    <Mail className="size-5 shrink-0 text-brand-400" aria-hidden="true" /> {settings.email}
                  </a>
                </li>
              )}
              {settings.locations.map((loc) => (
                <li key={loc} className="flex items-center gap-3">
                  <MapPin className="size-5 text-brand-400" aria-hidden="true" /> {loc}
                </li>
              ))}
            </ul>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-9 w-full">
              <WhatsAppIcon /> {dict.common.contactOnWhatsapp}
            </a>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="home-faq" className="container-page pb-20 sm:pb-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionHeading
              id="home-faq"
              title={dict.home.faqTitle}
              action={{ href: paths.faq(locale), label: dict.common.viewAll }}
            />
          </Reveal>
          <Reveal delay={100}>
            <FaqList items={dict.faq.items.slice(0, 4)} />
          </Reveal>
        </div>
      </section>
    </>
  );
}

/**
 * Visuel du héro : carte blanche avec le logo officiel (sac et mosquée).
 * Si une photo d'accueil est envoyée dans l'administration, elle s'affiche
 * sous le logo.
 */
function HeroVisual({
  image,
  alt,
  name,
  locations,
  categories,
}: {
  image: string | null;
  alt: string;
  name: string;
  locations: string[];
  categories: string[];
}) {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="overflow-hidden rounded-[2.25rem] border border-line bg-white shadow-[0_30px_80px_-40px_rgb(7_63_75/0.45)]">
        {image ? (
          <div className="relative aspect-[4/3] bg-brand-50">
            <Image src={image} alt={alt} fill priority sizes="(min-width: 1024px) 40vw, 100vw" quality={85} className="object-cover" />
          </div>
        ) : null}
        <div className="flex flex-col items-center px-7 py-10 text-center sm:px-10 sm:py-12">
          <Image
            src="/brand/logo-mark.png"
            alt={`Logo ${name}`}
            width={236}
            height={293}
            priority={!image}
            className={`${image ? "h-24" : "h-40 sm:h-48"} w-auto`}
          />
          <p className="mt-7 text-2xl leading-tight font-extrabold tracking-wide text-ink uppercase sm:text-[1.75rem]">{name}</p>
          <StarFrieze className="mt-4" count={4} />
          <p className="mt-4 text-sm font-semibold text-muted">{locations.join(" · ")}</p>
          <ul className="mt-7 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <li key={c} className="rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-800">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
