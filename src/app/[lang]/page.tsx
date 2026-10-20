import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
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
import { EightPointStar, PatternBackground, StarFrieze } from "@/components/ui/ornament";
import { WhatsAppIcon } from "@/components/ui/icons";
import { CategoryTile } from "@/components/catalog/category-tile";
import { ProductCard } from "@/components/catalog/product-card";
import { BrandMarquee } from "@/components/home/brand-marquee";
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
        <PatternBackground className="text-brand-100" />
        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="eyebrow">{dict.hero.eyebrow}</p>
            <h1 className="mt-4 text-[2.35rem] leading-[1.05] font-extrabold text-ink sm:text-5xl lg:text-[3.6rem]">
              {dict.hero.title}
            </h1>
            <StarFrieze count={5} className="mt-6" />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{dict.hero.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={paths.shop(locale)} className="btn btn-primary">
                {dict.hero.ctaShop} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                <WhatsAppIcon className="size-5" /> {dict.hero.ctaWhatsapp}
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink-soft">
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

      {/* CATÉGORIES */}
      {categories.length > 0 && (
        <section aria-labelledby="home-categories" className="container-page py-16 sm:py-20">
          <Reveal>
            <SectionHeading
              id="home-categories"
              title={dict.home.categoriesTitle}
              subtitle={dict.home.categoriesSubtitle}
              action={{ href: paths.shop(locale), label: dict.common.viewAll }}
            />
            <Carousel label={dict.home.categoriesTitle} itemClassName="w-[64%] sm:w-[38%] lg:w-[23.5%] xl:w-[19%]">
              {categories.map((c, i) => (
                <CategoryTile key={c.id} category={c} locale={locale} index={i} />
              ))}
            </Carousel>
          </Reveal>
        </section>
      )}

      <BrandMarquee label={dict.home.marqueeLabel} items={categories.map((c) => pick(c, "name", locale))} />

      {/* PRODUITS */}
      {products.length === 0 ? (
        <section className="container-page py-16 sm:py-20">
          <div className="card relative overflow-hidden px-6 py-12 text-center sm:px-12">
            <PatternBackground className="text-brand-50" />
            <div className="relative mx-auto max-w-xl">
              <EightPointStar className="mx-auto size-8 text-gold-bright" />
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">{dict.home.emptyCatalogTitle}</h2>
              <p className="mt-3 text-muted">{dict.home.emptyCatalogText}</p>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-7">
                <WhatsAppIcon /> {dict.common.contactOnWhatsapp}
              </a>
            </div>
          </div>
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <section aria-labelledby="home-featured" className="container-page pt-16 sm:pt-20">
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
          <section aria-labelledby="home-latest" className="container-page pt-16 sm:pt-20">
            <Reveal>
              <SectionHeading
                id="home-latest"
                title={featured.length > 0 ? dict.home.latestTitle : dict.home.discoverTitle}
                subtitle={featured.length > 0 ? dict.home.latestSubtitle : dict.home.discoverSubtitle}
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
      <section className="container-page py-16 sm:py-24">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <Reveal className="grid grid-cols-2 gap-4">
            {settings.hero_video_url ? (
              <video
                className="col-span-2 aspect-video w-full rounded-[var(--radius-card)] bg-ink object-cover"
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
                  className={`relative overflow-hidden rounded-[var(--radius-card)] bg-paper ${
                    editorialImages.length === 1 ? "col-span-2 aspect-[4/3]" : i === 0 ? "aspect-[3/4]" : "mt-10 aspect-[3/4]"
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={(locale === "wo" ? img.alt_text_wo : img.alt_text_fr) || pick(p, "name", locale)}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    quality={70}
                    className="object-cover"
                  />
                </Link>
              ))
            ) : (
              <div className="relative col-span-2 grid aspect-[16/11] place-items-center overflow-hidden rounded-[var(--radius-card)] bg-brand-500">
                <PatternBackground className="text-white/25" />
                <div className="relative text-center">
                  <EightPointStar className="mx-auto size-12 text-white" />
                  <p className="mt-4 font-display text-2xl font-extrabold tracking-wide text-ink uppercase">
                    {settings.business_name}
                  </p>
                </div>
              </div>
            )}
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow">{dict.home.brandEyebrow}</p>
            <h2 className="mt-3 text-3xl leading-tight font-extrabold sm:text-4xl">{dict.home.editorialTitle}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{dict.home.editorialText}</p>
            <Link href={paths.shop(locale)} className="btn btn-dark mt-8">
              {dict.home.editorialCta} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* COMMENT COMMANDER */}
      <section aria-labelledby="home-how" className="bg-white py-16 sm:py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading id="home-how" title={dict.home.howTitle} />
          </Reveal>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dict.home.howSteps.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 90} className="card relative p-6">
                <span className="font-display text-5xl font-extrabold text-brand-500/90">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 text-lg font-extrabold">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* LA BOUTIQUE */}
      <section className="relative overflow-hidden bg-brand-500">
        <PatternBackground className="text-white/20" />
        <div className="container-page relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <Reveal>
            <p className="font-display text-xs font-bold tracking-[0.18em] text-ink/80 uppercase">{dict.home.brandEyebrow}</p>
            <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">{dict.home.brandTitle}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink">{dict.home.brandText}</p>
          </Reveal>
          <Reveal delay={120} className="rounded-[var(--radius-card)] bg-ink p-6 text-white sm:p-8">
            <h3 className="font-display text-xl font-extrabold">{dict.home.contactTitle}</h3>
            <p className="mt-2 text-sm text-white/75">{dict.home.contactText}</p>
            <ul className="mt-6 space-y-3 text-[0.95rem]">
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
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-7 w-full">
              <WhatsAppIcon /> {dict.common.contactOnWhatsapp}
            </a>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="home-faq" className="container-page py-16 sm:py-24">
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
  if (image) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-paper shadow-[var(--shadow-lift)] sm:aspect-[5/5] lg:aspect-[4/5]">
        <Image src={image} alt={alt} fill priority sizes="(min-width: 1024px) 42vw, 100vw" quality={85} className="object-cover" />
      </div>
    );
  }
  // Composition graphique (aucune fausse photo de produit).
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-brand-500 shadow-[var(--shadow-lift)]">
      <PatternBackground className="text-white/25" />
      <div className="absolute top-8 left-1/2 h-16 w-28 -translate-x-1/2 rounded-t-full border-[6px] border-b-0 border-white/90" />
      <div className="absolute inset-x-8 top-24 bottom-8 flex flex-col justify-end rounded-[1.5rem] bg-ink/90 p-6 backdrop-blur-sm">
        <EightPointStar className="size-8 text-gold-bright" />
        <p className="mt-4 font-display text-2xl leading-tight font-extrabold tracking-wide text-white uppercase">{name}</p>
        <StarFrieze className="mt-3" count={4} />
        <p className="mt-3 text-sm text-white/70">{locations.join(" · ")}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c} className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white">
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
