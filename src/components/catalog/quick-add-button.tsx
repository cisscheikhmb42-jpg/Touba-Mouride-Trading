"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCart, type CartItem } from "@/components/cart/cart-provider";
import { useI18n } from "@/i18n/client";

export function QuickAddButton({ item, label }: { item: CartItem; label: string }) {
  const { add } = useCart();
  const { dict } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        add(item);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className="relative z-10 grid size-10 place-items-center rounded-full bg-brand-500 text-ink transition hover:bg-brand-400"
    >
      {done ? <Check className="size-5" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
      <span role="status" className="sr-only">
        {done ? dict.product.added : ""}
      </span>
    </button>
  );
}
