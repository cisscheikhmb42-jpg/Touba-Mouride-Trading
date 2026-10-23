import { BagMark } from "@/components/ui/ornament";

/** Emplacement neutre tant que la vraie photo n'est pas ajoutée (aucune fausse image). */
export function ImagePlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-brand-50 to-white ${className}`}>
      <BagMark className="h-12 w-10 opacity-70" />
      {label && <span className="text-[0.7rem] font-bold tracking-[0.16em] text-brand-700 uppercase">{label}</span>}
    </div>
  );
}
