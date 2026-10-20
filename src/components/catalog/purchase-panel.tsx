"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/config";
import { paths } from "@/i18n/paths";
import type { Product, ProductVariant } from "@/lib/types";
import { isOrderable, variantStock } from "@/lib/data/product-utils";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Price } from "./price";
import { StockBadge } from "./stock-badge";
import { QuantityStepper } from "./quantity-stepper";

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
          amount={unitPrice}
          compareAt={variant?.price ? null : product.compare_at_price}
          labels={{ toConfirm: dict.product.priceToConfirm, compareAt: dict.product.compareAt }}
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
          <div className="flex flex-col gap-3 sm:flex-row">
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
          <p role="status" className="sr-only">
            {added ? `${name} — ${dict.product.added}` : ""}
          </p>
        </>
      ) : (
        <p className="rounded-2xl bg-paper p-4 text-sm font-medium text-ink-soft">{dict.product.unavailableNotice}</p>
      )}

      <a href={infoHref} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-2 text-sm">
        <WhatsAppIcon className="size-4" /> {dict.product.askOnWhatsapp}
      </a>
    </div>
  );
}
