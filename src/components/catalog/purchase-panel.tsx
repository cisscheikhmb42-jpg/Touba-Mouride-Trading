"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/config";
import { paths } from "@/i18n/paths";
import type { Product, ProductVariant } from "@/lib/types";
import { displayPrice, isOrderable, variantStock } from "@/lib/data/product-utils";
import { formatFCFA } from "@/lib/format";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Price } from "./price";
import { StockBadge } from "./stock-badge";
import { QuantityStepper } from "./quantity-stepper";
import { AskPriceButton } from "./ask-price-button";

function variantLabel(v: ProductVariant) {
  return [v.size?.trim(), v.color?.trim()].filter(Boolean).join(" / ");
}

export function PurchasePanel({ product, infoHref }: { product: Product; infoHref: string }) {
  const { locale, dict } = useI18n();
  const { add } = useCart();
  const router = useRouter();
  const variants = product.product_variants;
  const firstOrderable = variants.find((v) => isOrderable(variantStock(product, v)));
  const [variantId, setVariantId] = useState<string | null>(variants.length === 1 ? (firstOrderable?.id ?? null) : null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const state = variantStock(product, variant);
  const orderable = isOrderable(state) && (variants.length === 0 || variant !== null);
  const productOrderable = isOrderable(variantStock(product, null));
  const unitPrice = variant ? (variant.price ?? product.price) : product.price;
  const max = product.track_inventory
    ? Math.max(1, Math.min(99, variant ? variant.stock_quantity : product.stock_quantity))
    : 99;
  const name = locale === "wo" ? product.name_wo || product.name_fr : product.name_fr;
  // Sans variante choisie : prix « à partir de » calculé sur les variantes réelles.
  const shown = variant || variants.length === 0 ? { amount: unitPrice, from: false } : displayPrice(product);

  // Barre d'achat fixe sur mobile quand les boutons principaux sont hors écran.
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = actionsRef.current;
      // Visible seulement quand les boutons principaux sont passés au-dessus de l'écran.
      setShowSticky(!!el && el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const addToCart = () => {
    if (variants.length > 0 && !variant) {
      setError(dict.product.chooseVariant);
      return false;
    }
    if (!orderable) return false;
    add({
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity: Math.min(quantity, max),
      snapshot: {
        nameFr: product.name_fr,
        nameWo: product.name_wo,
        slug: product.slug,
        imageUrl: product.product_images[0]?.image_url ?? null,
        unitPrice,
        variantLabel: variant ? variantLabel(variant) : null,
      },
    });
    setError(null);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Price
          amount={shown.amount}
          from={shown.from}
          compareAt={variant?.price || shown.from ? null : product.compare_at_price}
          labels={{ toConfirm: dict.product.priceToConfirm, compareAt: dict.product.compareAt, from: dict.product.from }}
          size="lg"
        />
        <StockBadge state={state} dict={dict} />
      </div>

      {variants.length > 0 && (
        <fieldset>
          <legend className="field-label">{dict.product.options}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const vState = variantStock(product, v);
              const ok = isOrderable(vState);
              const selected = v.id === variantId;
              return (
                <label
                  key={v.id}
                  className={`relative flex min-h-11 min-w-12 cursor-pointer items-center justify-center rounded-full border-2 px-4 text-sm font-semibold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-700 ${
                    selected ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
                  } ${ok ? "" : "cursor-not-allowed opacity-45 line-through"}`}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={selected}
                    disabled={!ok}
                    onChange={() => {
                      setVariantId(v.id);
                      setError(null);
                      setQuantity(1);
                    }}
                    className="sr-only"
                  />
                  {variantLabel(v)}
                  {v.price !== null && v.price !== product.price && <span className="sr-only"> — {v.price} FCFA</span>}
                </label>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </fieldset>
      )}

      {productOrderable ? (
        <>
          <div>
            <span className="field-label" id="qty-label">
              {dict.product.quantity}
            </span>
            <QuantityStepper id="qty" label={dict.product.quantity} value={quantity} onChange={setQuantity} max={max} />
            {product.track_inventory && quantity >= max && max > 1 && (
              <p className="mt-2 text-xs text-muted">{format(dict.product.maxStock, { n: max })}</p>
            )}
          </div>
          <div ref={actionsRef} className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={addToCart} disabled={variants.length > 0 && variant !== null && !orderable} className="btn btn-primary flex-1">
              {added ? <Check className="size-5" aria-hidden="true" /> : <ShoppingBag className="size-5" aria-hidden="true" />}
              {added ? dict.product.added : dict.product.addToCart}
            </button>
            <button
              type="button"
              onClick={() => {
                if (addToCart()) router.push(`${paths.cart(locale)}#commande`);
              }}
              disabled={variants.length > 0 && variant !== null && !orderable}
              className="btn btn-whatsapp flex-1"
            >
              <WhatsAppIcon /> {dict.product.orderOnWhatsapp}
            </button>
          </div>
          {shown.amount === null && <AskPriceButton name={name} slug={product.slug} />}
          <p role="status" className="sr-only">
            {added ? `${name} — ${dict.product.added}` : ""}
          </p>
          {showSticky && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgb(17_17_17/0.25)] backdrop-blur lg:hidden">
              <div className="mx-auto flex max-w-xl items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{name}</p>
                  <p className="text-sm font-semibold text-ink-soft">
                    {shown.amount !== null ? `${shown.from ? `${dict.product.from} ` : ""}${formatFCFA(shown.amount)}` : dict.product.priceToConfirm}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (variants.length > 0 && !variant) {
                      actionsRef.current?.scrollIntoView({ block: "center" });
                      setError(dict.product.chooseVariant);
                      return;
                    }
                    addToCart();
                  }}
                  disabled={variants.length > 0 && variant !== null && !orderable}
                  className="btn btn-primary shrink-0 px-5"
                >
                  {added ? <Check className="size-5" aria-hidden="true" /> : <ShoppingBag className="size-5" aria-hidden="true" />}
                  {added ? dict.product.added : dict.product.addToCart}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="rounded-2xl bg-paper p-4 text-sm font-medium text-ink-soft">{dict.product.unavailableNotice}</p>
      )}

      <a href={infoHref} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-2 text-sm">
        <WhatsAppIcon className="size-4" /> {dict.product.askOnWhatsapp}
      </a>
      <p className="text-xs leading-relaxed text-muted">{dict.product.paymentNote}</p>
    </div>
  );
}
