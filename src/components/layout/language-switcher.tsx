"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { locales, localeNames, LOCALE_COOKIE } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/paths";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname() || `/${locale}`;
  return (
    <nav aria-label={dict.common.language} className={className}>
      <ul className="flex items-center rounded-full border border-line bg-white p-0.5 text-xs font-bold">
        {locales.map((l) => {
          const active = l === locale;
          return (
            <li key={l}>
              <Link
                href={switchLocalePath(pathname, l)}
                hrefLang={l}
                lang={l}
                aria-current={active ? "true" : undefined}
                onClick={() => {
                  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
                }}
                className={`block rounded-full px-2.5 py-1.5 uppercase transition ${
                  active ? "bg-ink text-white" : "text-muted hover:text-ink"
                }`}
              >
                <span aria-hidden="true">{l}</span>
                <span className="sr-only">{localeNames[l]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
