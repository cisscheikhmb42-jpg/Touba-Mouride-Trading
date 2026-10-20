"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { EightPointStar } from "./ornament";

/** Bandeau défilant fin au-dessus de l'en-tête (messages gérés en admin). */
export function AnnouncementBar({ messages }: { messages: string[] }) {
  const { dict } = useI18n();
  const [paused, setPaused] = useState(false);
  if (messages.length === 0) return null;
  // Répété pour une boucle continue ; la 2e moitié est masquée aux lecteurs d'écran.
  const repeated = messages.length < 4 ? [...messages, ...messages] : messages;
  const group = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {repeated.map((m, i) => (
        <li key={i} className="flex items-center gap-6 px-6 whitespace-nowrap">
          <EightPointStar className="size-2.5 text-gold-bright" />
          <span>{m}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee relative bg-ink text-white" data-paused={paused}>
      <div className="flex h-9 items-center overflow-hidden text-[0.8rem] font-medium tracking-wide">
        <div className="marquee-track flex w-max">
          {group(false)}
          {group(true)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? dict.common.playAnimation : dict.common.pauseAnimation}
        aria-pressed={paused}
        className="absolute inset-y-0 right-0 grid w-9 place-items-center bg-ink text-white/80 hover:text-white"
      >
        {paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
      </button>
    </div>
  );
}
