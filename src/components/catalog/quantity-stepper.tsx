"use client";

import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/i18n/client";

export function QuantityStepper({
  value,
  onChange,
  max = 99,
  id,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  id: string;
  label: string;
}) {
  const { dict } = useI18n();
  const clamp = (n: number) => Math.max(1, Math.min(max, Number.isFinite(n) ? Math.trunc(n) : 1));
  return (
    <div className="inline-flex h-12 items-center rounded-full border border-line bg-white">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
        aria-label={dict.product.decrease}
        className="grid size-12 place-items-center rounded-full disabled:opacity-35"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="w-12 [appearance:textfield] bg-transparent text-center font-bold [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={dict.product.increase}
        className="grid size-12 place-items-center rounded-full disabled:opacity-35"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
