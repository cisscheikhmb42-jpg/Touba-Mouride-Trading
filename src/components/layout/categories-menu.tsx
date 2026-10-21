"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { paths } from "@/i18n/paths";

/** Menu déroulant des catégories (ordinateur). Fermeture : Échap, clic extérieur, navigation. */
export function CategoriesMenu({ categories }: { categories: { slug: string; name: string }[] }) {
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-full px-3 py-2 font-display text-sm font-bold whitespace-nowrap text-ink-soft transition hover:bg-paper hover:text-ink"
      >
        {dict.common.categories}
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute top-full left-0 z-50 mt-2 w-[34rem] rounded-[var(--radius-card)] border border-line bg-white p-3 shadow-[var(--shadow-lift)]"
        >
          <ul className="grid grid-cols-2 gap-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={paths.category(locale, c.slug)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-brand-50 hover:text-ink"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={paths.shop(locale)}
            className="mt-2 block rounded-xl bg-paper px-3 py-2.5 text-center text-sm font-bold text-ink hover:bg-brand-50"
          >
            {dict.common.allCategories} →
          </Link>
        </div>
      )}
    </div>
  );
}
