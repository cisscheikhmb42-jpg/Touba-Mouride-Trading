import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo";
import { getStoreSettings } from "@/lib/data/catalog";
import { whatsappUrl } from "@/lib/whatsapp";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { InstagramIcon, TikTokIcon, FacebookIcon, WhatsAppIcon } from "@/components/ui/icons";
import { StarFrieze } from "@/components/ui/ornament";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/contact", title: dict.contactPage.title, description: dict.contactPage.description });
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);
  const s = await getStoreSettings();
  const hours = locale === "wo" ? s.opening_hours_wo || s.opening_hours_fr : s.opening_hours_fr;
  const socials = [
    s.instagram_url && { href: s.instagram_url, label: "Instagram", Icon: InstagramIcon },
    s.tiktok_url && { href: s.tiktok_url, label: "TikTok", Icon: TikTokIcon },
    s.facebook_url && { href: s.facebook_url, label: "Facebook", Icon: FacebookIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof InstagramIcon }[];

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.common.home, href: paths.home(locale) },
          { label: dict.contactPage.title, href: paths.contact(locale) },
        ]}
      />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-5xl">{dict.contactPage.title}</h1>
          <StarFrieze className="mt-5" />
          <p className="mt-5 max-w-lg text-lg text-muted">{dict.contactPage.intro}</p>
          <a href={whatsappUrl(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-8">
            <WhatsAppIcon /> {dict.common.contactOnWhatsapp}
          </a>
        </div>
        <div className="card divide-y divide-line">
          <ContactRow icon={<Phone className="size-5" aria-hidden="true" />} label={dict.common.phone}>
            <a href={`tel:${s.phone_international}`} className="link">
              {s.phone_display}
            </a>
          </ContactRow>
          <ContactRow icon={<WhatsAppIcon className="size-5" />} label="WhatsApp">
            <a href={whatsappUrl(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="link">
              {s.phone_international}
            </a>
          </ContactRow>
          {s.email && (
            <ContactRow icon={<Mail className="size-5" aria-hidden="true" />} label={dict.common.email}>
              <a href={`mailto:${s.email}`} className="link break-all">
                {s.email}
              </a>
            </ContactRow>
          )}
          <ContactRow icon={<MapPin className="size-5" aria-hidden="true" />} label={dict.common.locations}>
            <ul>
              {s.locations.map((l) => (
                <li key={l} className="font-semibold">
                  {l}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted">{dict.contactPage.locationsNote}</p>
          </ContactRow>
          <ContactRow icon={<Clock className="size-5" aria-hidden="true" />} label="">
            <p className="text-sm text-muted whitespace-pre-line">{hours || dict.contactPage.hoursPending}</p>
          </ContactRow>
          {socials.length > 0 && (
            <ContactRow icon={<InstagramIcon className="size-5" />} label={dict.common.followUs}>
              <ul className="flex flex-wrap gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-semibold hover:border-ink">
                      <Icon className="size-4" /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            </ContactRow>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">{icon}</span>
      <div className="min-w-0">
        {label && <p className="text-xs font-bold tracking-wider text-muted uppercase">{label}</p>}
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
