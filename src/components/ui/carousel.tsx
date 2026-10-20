"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/client";

/**
 * Carrousel horizontal accessible : défilement natif (tactile, souris,
 * molette), accrochage scroll-snap, boutons précédent/suivant, piste
 * focusable au clavier (flèches). Le reste de la page ne défile pas
 * horizontalement.
 */
export function Carousel({
  label,
  children,
  itemClassName = "w-[78%] sm:w-[46%] lg:w-[31%] xl:w-[23.5%]",
}: {
  label: string;
  children: React.ReactNode[];
  itemClassName?: string;
}) {
  const { dict } = useI18n();
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const scrollBy = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        role="list"
        aria-label={label}
        tabIndex={0}
        className="scroller -mx-4 px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {children.map((child, i) => (
          <li key={i} className={`${itemClassName} shrink-0`}>
            {child}
          </li>
        ))}
      </ul>
      <div className="mt-4 hidden justify-end gap-2 md:flex">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={edges.start}
          aria-label={dict.common.previous}
          className="grid size-11 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-ink disabled:opacity-35"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={edges.end}
          aria-label={dict.common.next}
          className="grid size-11 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-ink disabled:opacity-35"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
