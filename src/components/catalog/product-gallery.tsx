"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { format } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { ImagePlaceholder } from "./image-placeholder";

export type GalleryImage = { id: string; url: string; alt: string };

/** Galerie : glisser au doigt (scroll-snap), miniatures cliquables. */
export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const { dict } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-line">
        <ImagePlaceholder label={dict.product.photoComing} />
      </div>
    );
  }

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setActive(i);
  };

  return (
    <div role="region" aria-label={dict.product.gallery} className="space-y-3">
      <div
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== active) setActive(i);
        }}
        className="scroller aspect-[4/5] gap-0 overflow-hidden rounded-[1.5rem] border border-line bg-white"
        tabIndex={0}
      >
        {images.map((img, i) => (
          <div key={img.id} className="relative h-full w-full shrink-0">
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              quality={85}
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={format(dict.product.showImage, { n: i + 1 })}
                aria-current={i === active ? "true" : undefined}
                className={`relative block size-[4.5rem] overflow-hidden rounded-xl border-2 transition ${
                  i === active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="72px" quality={70} className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
