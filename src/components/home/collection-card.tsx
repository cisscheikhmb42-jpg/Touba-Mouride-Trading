import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { paths } from "@/i18n/paths";
import type { Category } from "@/lib/types";
import { pick } from "@/lib/types";
import { EightPointStar, PatternBackground, StarFrieze } from "@/components/ui/ornament";

/** Grande carte de collection (catégorie mise en avant), reliée au vrai catalogue. */
export function CollectionCard({
  category,
  locale,
  eyebrow,
  cta,
  tone,
}: {
  category: Category;
  locale: Locale;
  eyebrow: string;
  cta: string;
  tone: "dark" | "brand";
}) {
  const name = pick(category, "name", locale);
  const description = pick(category, "description", locale);
  return (
    <Link
      href={paths.category(locale, category.slug)}
      className={`group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-[1.75rem] p-7 sm:min-h-[26rem] sm:p-9 ${
        tone === "dark" ? "bg-ink text-white" : "bg-brand-500 text-ink"
      }`}
    >
      {category.image_url ? (
        <>
          <Image
            src={category.image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            quality={70}
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
        </>
      ) : (
        <span aria-hidden="true" className="absolute inset-0">
          <PatternBackground className={tone === "dark" ? "text-brand-400/20" : "text-white/30"} />
          <EightPointStar
            className={`absolute -top-10 -right-10 size-56 transition duration-700 group-hover:rotate-12 ${
              tone === "dark" ? "text-brand-500/25" : "text-white/35"
            }`}
          />
        </span>
      )}
      <span className="relative">
        <span
          className={`font-display text-xs font-bold tracking-[0.2em] uppercase ${
            category.image_url || tone === "dark" ? "text-gold-bright" : "text-ink/80"
          }`}
        >
          {eyebrow}
        </span>
        <span className={`mt-3 block font-display text-3xl font-extrabold sm:text-4xl ${category.image_url ? "text-white" : ""}`}>
          {name}
        </span>
        <StarFrieze className="mt-4" count={4} />
        {description && (
          <span className={`mt-4 block max-w-md text-[0.95rem] leading-relaxed ${category.image_url || tone === "dark" ? "text-white/80" : "text-ink/80"}`}>
            {description}
          </span>
        )}
        <span
          className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 font-display text-sm font-bold transition group-hover:gap-3 ${
            category.image_url || tone === "dark" ? "bg-white text-ink" : "bg-ink text-white"
          }`}
        >
          {cta} <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
