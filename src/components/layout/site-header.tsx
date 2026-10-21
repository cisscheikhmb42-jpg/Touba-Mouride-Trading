import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/i18n/paths";
import type { Category, StoreSettings } from "@/lib/types";
import { pick } from "@/lib/types";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";
import { AnnouncementBar } from "@/components/ui/announcement-bar";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { CartButton } from "./cart-button";
import { SearchForm } from "./search-form";
import { MobileMenu } from "./mobile-menu";
import { CategoriesMenu } from "./categories-menu";

export function SiteHeader({
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
  const messages = settings.announcement_enabled
    ? (locale === "wo" && settings.announcement_wo.length ? settings.announcement_wo : settings.announcement_fr)
    : [];
  const wa = whatsappUrl(settings.whatsapp_number);
  const nav = [
    { href: paths.shop(locale), label: dict.common.shop },
    { href: paths.faq(locale), label: dict.common.faq },
    { href: paths.contact(locale), label: dict.common.contact },
  ];
  return (
    <>
      <AnnouncementBar messages={messages} />
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        <div className="container-page flex h-[var(--header-height)] items-center gap-3">
          <Link href={paths.home(locale)} aria-label={`${settings.business_name} — ${dict.common.home}`} className="mr-auto shrink-0 lg:mr-0">
            <Logo logoUrl={settings.logo_url} />
          </Link>
          <nav aria-label={dict.common.menu} className="ml-8 hidden lg:block">
            <ul className="flex items-center gap-1">
              <li>
                <CategoriesMenu categories={categories.map((c) => ({ slug: c.slug, name: pick(c, "name", locale) }))} />
              </li>
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="rounded-full px-3 py-2 font-display text-sm font-bold whitespace-nowrap text-ink-soft transition hover:bg-paper hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <SearchForm id="header-search" className="mx-auto hidden w-full max-w-xs md:block lg:hidden xl:block xl:max-w-sm" />
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher className="hidden sm:block" />
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-[#117a3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0d6331] xl:inline-flex"
            >
              <WhatsAppIcon className="size-4" /> {dict.common.whatsapp}
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={dict.common.contactOnWhatsapp}
              className="grid size-11 place-items-center rounded-full text-[#117a3d] hover:bg-brand-50 xl:hidden"
            >
              <WhatsAppIcon className="size-6" />
            </a>
            <CartButton />
            <MobileMenu
              whatsappHref={wa}
              categories={categories.map((c) => ({ slug: c.slug, name: pick(c, "name", locale) }))}
            />
          </div>
        </div>
      </header>
    </>
  );
}
