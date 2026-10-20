import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import type { Category, StoreSettings } from "@/lib/types";
import { pick } from "@/lib/types";
import { whatsappUrl } from "@/lib/whatsapp";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/icons";
import { StarFrieze } from "@/components/ui/ornament";
import { Logo } from "./logo";

export function SiteFooter({
  locale,
  dict,
  settings,
  categories,
}: {
  locale: Locale;
  dict: Dictionary;
  settings: StoreSettings;
  categories: Category[];
}) {
  const socials = [
    settings.instagram_url && { href: settings.instagram_url, label: "Instagram", Icon: InstagramIcon },
    settings.tiktok_url && { href: settings.tiktok_url, label: "TikTok", Icon: TikTokIcon },
    settings.facebook_url && { href: settings.facebook_url, label: "Facebook", Icon: FacebookIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof InstagramIcon }[];

  return (
    <footer className="mt-24 bg-ink text-white/80">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo logoUrl={settings.logo_url} variant="light" size="lg" />
          <StarFrieze className="mt-5" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">{dict.footer.tagline}</p>
          {socials.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 font-display text-xs font-bold tracking-[0.18em] text-white uppercase">{dict.common.followUs}</p>
              <ul className="flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid size-11 place-items-center rounded-full border border-white/15 text-white transition hover:border-brand-500 hover:text-brand-400"
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <FooterColumn title={dict.footer.navigation}>
          <FooterLink href={paths.home(locale)}>{dict.common.home}</FooterLink>
          <FooterLink href={paths.shop(locale)}>{dict.common.shop}</FooterLink>
          <FooterLink href={paths.cart(locale)}>{dict.common.cart}</FooterLink>
          <FooterLink href={paths.faq(locale)}>{dict.common.faq}</FooterLink>
          <FooterLink href={paths.blog(locale)}>{dict.common.blog}</FooterLink>
          <FooterLink href={paths.contact(locale)}>{dict.common.contact}</FooterLink>
        </FooterColumn>
        <FooterColumn title={dict.common.categories}>
          {categories.map((c) => (
            <FooterLink key={c.slug} href={paths.category(locale, c.slug)}>
              {pick(c, "name", locale)}
            </FooterLink>
          ))}
        </FooterColumn>
        <div className="space-y-10">
          <FooterColumn title={dict.common.contact}>
            <li>
              <a href={whatsappUrl(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 py-1 text-sm hover:text-white">
                <WhatsAppIcon className="size-4 text-brand-400" /> WhatsApp · {settings.phone_display}
              </a>
            </li>
            <li>
              <a href={`tel:${settings.phone_international}`} className="flex items-center gap-2.5 py-1 text-sm hover:text-white">
                <Phone className="size-4 text-brand-400" aria-hidden="true" /> {settings.phone_display}
              </a>
            </li>
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 py-1 text-sm break-all hover:text-white">
                  <Mail className="size-4 shrink-0 text-brand-400" aria-hidden="true" /> {settings.email}
                </a>
              </li>
            )}
            {settings.locations.map((loc) => (
              <li key={loc} className="flex items-center gap-2.5 py-1 text-sm">
                <MapPin className="size-4 text-brand-400" aria-hidden="true" /> {loc}
              </li>
            ))}
          </FooterColumn>
          <FooterColumn title={dict.footer.legal}>
            <FooterLink href={paths.delivery(locale)}>{dict.footer.delivery}</FooterLink>
            <FooterLink href={paths.terms(locale)}>{dict.footer.terms}</FooterLink>
            <FooterLink href={paths.privacy(locale)}>{dict.footer.privacy}</FooterLink>
          </FooterColumn>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {settings.business_name}. {dict.footer.rights}
          </p>
          <Link href="/admin" rel="nofollow" className="hover:text-white">
            {dict.footer.admin}
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-display text-xs font-bold tracking-[0.18em] text-white uppercase">{title}</h2>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="inline-block py-1 text-sm transition hover:text-white">
        {children}
      </Link>
    </li>
  );
}
