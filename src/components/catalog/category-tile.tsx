import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { paths } from "@/i18n/paths";
import type { Category } from "@/lib/types";
import { pick } from "@/lib/types";
import { StarFrieze } from "@/components/ui/ornament";

/** Les trois couleurs du logo : turquoise, noir, blanc. */
const TONES = [
  { bg: "bg-brand-500", text: "text-ink", num: "text-ink/20", btn: "bg-ink text-white", frieze: "ink" as const },
  { bg: "bg-ink", text: "text-white", num: "text-brand-500/35", btn: "bg-brand-500 text-ink", frieze: "gold" as const },
  { bg: "bg-white border border-line", text: "text-ink", num: "text-brand-500/40", btn: "bg-ink text-white", frieze: "gold" as const },
];

export function CategoryTile({ category, locale, index }: { category: Category; locale: Locale; index: number }) {
  const name = pick(category, "name", locale);
  const tone = TONES[index % TONES.length];
  return (
    <Link
      href={paths.category(locale, category.slug)}
      className={`group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${
        category.image_url ? "bg-ink" : tone.bg
      }`}
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
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
          <span aria-hidden="true" />
        </>
      ) : (
        <span aria-hidden="true" className={`text-6xl leading-none font-extrabold tracking-[-0.04em] ${tone.num}`}>
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span className="relative flex items-end justify-between gap-3">
        <span>
          {!category.image_url && <StarFrieze count={3} tone={tone.frieze} className="mb-3" />}
          <span className={`block text-lg leading-tight font-extrabold ${category.image_url ? "text-white" : tone.text}`}>{name}</span>
        </span>
        <span
          aria-hidden="true"
          className={`grid size-10 shrink-0 place-items-center rounded-full transition duration-300 group-hover:rotate-45 ${
            category.image_url ? "bg-white text-ink" : tone.btn
          }`}
        >
          <ArrowUpRight className="size-5" />
        </span>
      </span>
    </Link>
  );
}
