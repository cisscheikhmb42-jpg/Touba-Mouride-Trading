"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/config";
import { paths } from "@/i18n/paths";

export function CartButton() {
  const { count, hydrated } = useCart();
  const { locale, dict } = useI18n();
  return (
    <Link
      href={paths.cart(locale)}
      aria-label={format(dict.common.cartCount, { n: hydrated ? count : 0 })}
      className="relative grid size-11 place-items-center rounded-full text-ink transition hover:bg-brand-50"
    >
      <ShoppingBag className="size-[1.4rem]" aria-hidden="true" />
      {hydrated && count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 grid min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[0.7rem] leading-5 font-bold text-ink"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
