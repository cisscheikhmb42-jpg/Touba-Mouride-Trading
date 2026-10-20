import { EightPointStar } from "@/components/ui/ornament";
import { MarqueeToggle } from "@/components/ui/marquee-toggle";

/** Bandeau de marque défilant : grandes catégories (décoratif). */
export function BrandMarquee({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return null;
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-8 px-8">
          <span className="font-display text-3xl font-extrabold tracking-tight whitespace-nowrap text-white sm:text-5xl">
            {item}
          </span>
          <EightPointStar className="size-5 shrink-0 text-gold-bright sm:size-6" />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label={label} className="marquee relative overflow-hidden bg-ink py-8 sm:py-10">
      <div className="marquee-track flex w-max [animation-duration:60s]">
        {row(false)}
        {row(true)}
      </div>
      <MarqueeToggle className="absolute right-3 bottom-2" />
    </section>
  );
}
