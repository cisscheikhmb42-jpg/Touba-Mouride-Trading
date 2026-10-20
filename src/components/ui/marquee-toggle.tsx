"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useI18n } from "@/i18n/client";

/** Bouton pause/lecture pour un bandeau défilant parent (.marquee). */
export function MarqueeToggle({ className = "" }: { className?: string }) {
  const { dict } = useI18n();
  const [paused, setPaused] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-label={paused ? dict.common.playAnimation : dict.common.pauseAnimation}
      onClick={(e) => {
        const next = !paused;
        setPaused(next);
        e.currentTarget.closest(".marquee")?.setAttribute("data-paused", String(next));
      }}
      className={`grid size-9 place-items-center rounded-full border border-white/25 text-white/80 hover:text-white ${className}`}
    >
      {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
    </button>
  );
}
