"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { paths } from "@/i18n/paths";
import { LanguageSwitcher } from "./language-switcher";
import { SearchForm } from "./search-form";
import { WhatsAppIcon } from "@/components/ui/icons";

export function MobileMenu({
  categories,
  whatsappHref,
}: {
  categories: { slug: string; name: string }[];
  whatsappHref: string;
}) {
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Ferme le menu après une navigation.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  const nav = [
    { href: paths.home(locale), label: dict.common.home },
    { href: paths.shop(locale), label: dict.common.shop },
    { href: paths.faq(locale), label: dict.common.faq },
    { href: paths.contact(locale), label: dict.common.contact },
    { href: paths.blog(locale), label: dict.common.blog },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.common.openMenu}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="grid size-11 place-items-center rounded-full text-ink hover:bg-brand-50 lg:hidden"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        aria-label={dict.common.menu}
        className="m-0 ml-auto h-dvh max-h-dvh w-[88vw] max-w-sm bg-white p-0 backdrop:bg-ink/50 backdrop:backdrop-blur-[2px]"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.common.close}
              className="grid size-11 place-items-center rounded-full hover:bg-paper"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <SearchForm id="mobile-search" />
            <nav aria-label={dict.common.menu} className="mt-6">
              <ul className="space-y-1">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block rounded-xl px-3 py-3 font-display text-lg font-bold hover:bg-paper">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="eyebrow mt-8 mb-2 px-3">{dict.common.categories}</p>
              <ul className="grid grid-cols-1 gap-0.5">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={paths.category(locale, c.slug)} className="block rounded-xl px-3 py-2.5 text-[0.95rem] font-medium hover:bg-paper">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="border-t border-line p-4">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
              <WhatsAppIcon /> {dict.common.contactOnWhatsapp}
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
