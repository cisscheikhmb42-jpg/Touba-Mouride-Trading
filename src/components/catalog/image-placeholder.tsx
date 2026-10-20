import { ImageIcon } from "lucide-react";
import { PatternBackground } from "@/components/ui/ornament";

/** Emplacement neutre tant que la vraie photo n'est pas ajoutée. */
export function ImagePlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden bg-brand-50 text-brand-700 ${className}`}>
      <PatternBackground className="text-brand-200" />
      <ImageIcon className="relative size-8" aria-hidden="true" />
      <span className="relative text-xs font-semibold tracking-wide uppercase">{label}</span>
    </div>
  );
}
