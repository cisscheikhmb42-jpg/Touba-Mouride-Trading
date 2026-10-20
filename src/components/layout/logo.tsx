import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * Logo officiel. Ordre de priorité :
 * 1. Logo envoyé dans Administration > Paramètres (Supabase Storage) ;
 * 2. Fichier public/brand/logo-mark.png (le sac turquoise seul, recadré) ;
 * 3. À défaut, un repère provisoire (sac turquoise simple, SANS minaret)
 *    pour ne pas imiter le logo officiel.
 * Le nom est composé en Montserrat ExtraBold, comme dans le logo.
 * L'image est toujours affichée en object-contain : jamais déformée.
 */
const LOCAL_MARK = "/brand/logo-mark.png";
const hasLocalMark = fs.existsSync(path.join(process.cwd(), "public", LOCAL_MARK));

export function Logo({
  logoUrl,
  variant = "dark",
  size = "md",
}: {
  logoUrl?: string | null;
  variant?: "dark" | "light";
  size?: "md" | "lg";
}) {
  const src = logoUrl || (hasLocalMark ? LOCAL_MARK : null);
  const box = size === "lg" ? "size-14" : "size-10 sm:size-11";
  return (
    <span className="flex items-center gap-2.5">
      <span className={`relative shrink-0 ${box}`}>
        {src ? (
          <Image src={src} alt="" fill sizes="56px" className="object-contain" priority />
        ) : (
          <ProvisionalMark />
        )}
      </span>
      <span
        className={`font-display leading-[1.05] font-extrabold tracking-[0.02em] uppercase ${
          variant === "light" ? "text-white" : "text-ink"
        } ${size === "lg" ? "text-xl" : "text-[0.8rem] sm:text-[0.95rem]"}`}
      >
        <span className="block">Touba Mouride</span>
        <span className="block">Trading</span>
      </span>
    </span>
  );
}

function ProvisionalMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-full w-full">
      <path d="M17 14a7 7 0 0 1 14 0" fill="none" stroke="#0fbddf" strokeWidth="3" strokeLinecap="round" />
      <path d="M9 15h30l-1.6 26.2a2 2 0 0 1-2 1.8H12.6a2 2 0 0 1-2-1.8Z" fill="#0fbddf" />
      <circle cx="17" cy="15" r="1.6" fill="#fff" />
      <circle cx="31" cy="15" r="1.6" fill="#fff" />
    </svg>
  );
}
