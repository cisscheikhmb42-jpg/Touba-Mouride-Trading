import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { paths } from "@/i18n/paths";
import type { Category } from "@/lib/types";
import { pick } from "@/lib/types";
import { PatternBackground } from "@/components/ui/ornament";

const TONES = ["bg-brand-500", "bg-ink", "bg-brand-800", "bg-[#1b2a2e]"];

export function CategoryTile({ category, locale, index }: { category: Category; locale: Locale; index: number }) {
  const name = pick(category, "name", locale);
  const dark = !category.image_url;
  const tone = TONES[index % TONES.length];
  const onLight = tone === "bg-brand-500";
  return (
    <Link
      href={paths.category(locale, category.slug)}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-ink"
    >
      {category.image_url ? (
        <>
          <Image
            src={category.image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 70vw"
            quality={70}
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
        </>
      ) : (
        <span aria-hidden="true" className={`absolute inset-0 ${tone}`}>
          <PatternBackground className={onLight ? "text-white/30" : "text-brand-400/25"} />
        </span>
      )}
      <span className="relative flex items-end justify-between gap-3 p-5">
        <span className={`font-display text-lg leading-tight font-extrabold ${dark && onLight ? "text-ink" : "text-white"}`}>
          {name}
        </span>
        <span
          aria-hidden="true"
          className={`grid size-10 shrink-0 place-items-center rounded-full transition group-hover:rotate-45 ${
            dark && onLight ? "bg-ink text-white" : "bg-white text-ink"
          }`}
        >
          <ArrowUpRight className="size-5" />
        </span>
      </span>
    </Link>
  );
}
