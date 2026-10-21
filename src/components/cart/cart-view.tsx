"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Info, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, type CartItem } from "./cart-provider";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/config";
import { paths } from "@/i18n/paths";
import { formatFCFA } from "@/lib/format";
import type { CartQuote, DeliveryZone, QuoteLine } from "@/lib/types";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { ImagePlaceholder } from "@/components/catalog/image-placeholder";
import { WhatsAppIcon } from "@/components/ui/icons";

type SuccessState = { orderNumber: string; whatsappUrl: string; message: string };
const LAST_ORDER_KEY = "tmt_last_order";

const lineKey = (productId: string, variantId: string | null) => `${productId}:${variantId ?? ""}`;

export function CartView({ zones }: { zones: DeliveryZone[] }) {
  const { locale, dict } = useI18n();
  const cart = useCart();
  const [zoneId, setZoneId] = useState<string>(zones.length === 1 ? zones[0].id : "");
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteState, setQuoteState] = useState<"idle" | "loading" | "error">("idle");
  const [priceNotices, setPriceNotices] = useState<string[]>([]);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  // Retour depuis WhatsApp : réaffiche la confirmation de la dernière demande.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSuccess(JSON.parse(raw));
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const itemsPayload = useMemo(
    () => cart.items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, quantity: i.quantity })),
    [cart.items],
  );

  const { updateSnapshots } = cart;
  const snapshotsRef = useRef(cart.items);
  useEffect(() => {
    snapshotsRef.current = cart.items;
  }, [cart.items]);

  const refreshQuote = useCallback(
    async (signal?: AbortSignal) => {
      if (itemsPayload.length === 0) {
        setQuote(null);
        return;
      }
      setQuoteState("loading");
      try {
        const res = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsPayload, delivery_zone_id: zoneId || null }),
          signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const { quote: q } = (await res.json()) as { quote: CartQuote };
        setQuote(q);
        setQuoteState("idle");
        // Signale les prix qui ont changé depuis l'ajout au panier.
        const notices: string[] = [];
        for (const line of q.lines) {
          const item = snapshotsRef.current.find((i) => lineKey(i.productId, i.variantId) === lineKey(line.product_id, line.variant_id));
          if (!item || line.issue === "not_found") continue;
          const before = item.snapshot.unitPrice;
          const name = (locale === "wo" ? line.name_wo : line.name_fr) || item.snapshot.nameFr;
          if (before !== null && line.unit_price !== null && before !== line.unit_price) {
            notices.push(format(dict.cart.priceChanged, { name, old: formatFCFA(before), new: formatFCFA(line.unit_price) }));
          } else if (before === null && line.unit_price !== null) {
            notices.push(format(dict.cart.priceNowKnown, { name, new: formatFCFA(line.unit_price) }));
          }
        }
        if (notices.length) {
          setPriceNotices((prev) => [...new Set([...prev, ...notices])]);
          updateSnapshots(q.lines.map((l) => ({ productId: l.product_id, variantId: l.variant_id, unitPrice: l.unit_price })));
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setQuoteState("error");
      }
    },
    [itemsPayload, zoneId, locale, dict, updateSnapshots],
  );

  useEffect(() => {
    if (!cart.hydrated) return;
    const controller = new AbortController();
    const t = setTimeout(() => refreshQuote(controller.signal), 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [cart.hydrated, refreshQuote]);

  if (success && cart.items.length === 0) {
    return (
      <SuccessPanel
        success={success}
        onDone={() => {
          try {
            sessionStorage.removeItem(LAST_ORDER_KEY);
          } catch {}
          setSuccess(null);
        }}
      />
    );
  }

  if (!cart.hydrated) {
    return (
      <div className="flex items-center gap-3 py-16 text-muted" role="status">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" /> {dict.common.loading}
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="card mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-700">
          <ShoppingBag className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold">{dict.cart.empty}</h2>
        <p className="mt-2 text-muted">{dict.cart.emptyText}</p>
        <Link href={paths.shop(locale)} className="btn btn-primary mt-7">
          {dict.cart.continue}
        </Link>
      </div>
    );
  }

  const lineFor = (item: CartItem): QuoteLine | undefined =>
    quote?.lines.find((l) => lineKey(l.product_id, l.variant_id) === lineKey(item.productId, item.variantId));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
      <div className="space-y-6">
        {priceNotices.length > 0 && (
          <div role="status" className="flex gap-3 rounded-2xl border border-[#f3d9a6] bg-[#fff8e8] p-4 text-sm text-warning">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <ul className="space-y-1">
              {priceNotices.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white">
          {cart.items.map((item) => (
            <CartLine key={lineKey(item.productId, item.variantId)} item={item} line={lineFor(item)} />
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={paths.shop(locale)} className="link text-sm">
            ← {dict.cart.continue}
          </Link>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(dict.cart.clearConfirm)) cart.clear();
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-danger hover:underline"
          >
            <Trash2 className="size-4" aria-hidden="true" /> {dict.cart.clear}
          </button>
        </div>
      </div>

      <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
        <Summary quote={quote} state={quoteState} zoneSelected={!!zoneId} />
        <CheckoutForm
          zones={zones}
          zoneId={zoneId}
          onZoneChange={setZoneId}
          quote={quote}
          quoteLoading={quoteState === "loading"}
          onQuote={setQuote}
          onSuccess={(s) => {
            try {
              sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(s));
            } catch {}
            setSuccess(s);
            cart.clear();
            window.scrollTo({ top: 0 });
          }}
        />
      </div>
    </div>
  );
}

function CartLine({ item, line }: { item: CartItem; line?: QuoteLine }) {
  const { locale, dict } = useI18n();
  const { setQuantity, remove } = useCart();
  const name = (locale === "wo" ? line?.name_wo || item.snapshot.nameWo : line?.name_fr || item.snapshot.nameFr) || item.snapshot.nameFr;
  const image = line?.image_url ?? item.snapshot.imageUrl;
  const unit = line ? line.unit_price : item.snapshot.unitPrice;
  const issue = line?.issue;
  const max = line?.track_inventory && line.available_quantity !== null ? Math.max(1, Math.min(99, line.available_quantity)) : 99;
  const id = `qty-${item.productId}-${item.variantId ?? "base"}`;

  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <Link href={paths.product(locale, item.snapshot.slug)} className="relative block size-24 shrink-0 overflow-hidden rounded-xl bg-paper sm:size-28">
        {image ? (
          <Image src={image} alt="" fill sizes="112px" quality={70} className="object-cover" />
        ) : (
          <ImagePlaceholder label="" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={paths.product(locale, item.snapshot.slug)} className="font-display font-bold text-ink hover:underline">
              {name}
            </Link>
            {(line?.variant_label ?? item.snapshot.variantLabel) && (
              <p className="text-sm text-muted">{line?.variant_label ?? item.snapshot.variantLabel}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(item.productId, item.variantId)}
            aria-label={format(dict.cart.removeItem, { name })}
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-paper hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-sm">
          {unit !== null ? (
            <span className="font-semibold">{formatFCFA(unit)}</span>
          ) : (
            <span className="font-semibold text-gold-deep">{dict.product.priceToConfirm}</span>
          )}
        </p>
        {issue && (
          <p role="alert" className="flex items-start gap-1.5 text-sm font-medium text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {format(dict.cart.issues[issue], { n: line?.available_quantity ?? 0 })}
              {issue === "insufficient_stock" && line?.available_quantity ? (
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => setQuantity(item.productId, item.variantId, line.available_quantity!)}
                >
                  {format(dict.cart.adjustQuantity, { n: line.available_quantity })}
                </button>
              ) : null}
            </span>
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            id={id}
            label={`${dict.product.quantity} — ${name}`}
            value={item.quantity}
            max={issue === "insufficient_stock" ? 99 : max}
            onChange={(n) => setQuantity(item.productId, item.variantId, n)}
          />
          {line?.line_total != null && !issue && <span className="font-display font-extrabold">{formatFCFA(line.line_total)}</span>}
        </div>
      </div>
    </li>
  );
}

function Summary({ quote, state, zoneSelected }: { quote: CartQuote | null; state: string; zoneSelected: boolean }) {
  const { dict } = useI18n();
  const t = dict.cart;
  return (
    <section aria-labelledby="summary-title" className="card p-5 sm:p-6">
      <h2 id="summary-title" className="font-display text-lg font-extrabold">
        {t.summary}
      </h2>
      {state === "error" && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {t.quoteError}
        </p>
      )}
      <dl className="mt-4 space-y-3 text-[0.95rem]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{quote?.has_unpriced_items ? t.subtotalPartial : t.subtotal}</dt>
          <dd className="font-semibold">{quote ? formatFCFA(quote.priced_subtotal) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t.deliveryFee}</dt>
          <dd className="text-right font-semibold">
            {!zoneSelected ? (
              <span className="text-sm font-normal text-muted">{t.chooseZone}</span>
            ) : quote?.delivery_fee_status === "known" && quote.delivery_fee !== null ? (
              formatFCFA(quote.delivery_fee)
            ) : (
              <span className="text-sm text-gold-deep">{t.feeToConfirm}</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line pt-3">
          <dt className="font-display font-extrabold">{t.total}</dt>
          <dd className="text-right font-display text-lg font-extrabold">
            {quote?.total != null ? formatFCFA(quote.total) : <span className="text-sm text-gold-deep">{t.totalToConfirm}</span>}
          </dd>
        </div>
      </dl>
      {quote?.has_unpriced_items && <p className="mt-4 text-xs leading-relaxed text-muted">{t.unpricedNotice}</p>}
      {state === "loading" && (
        <p role="status" className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> {t.updating}
        </p>
      )}
    </section>
  );
}

type FieldErrors = Partial<Record<"name" | "phone" | "zone" | "address" | "notes", string>>;

function CheckoutForm({
  zones,
  zoneId,
  onZoneChange,
  quote,
  quoteLoading,
  onQuote,
  onSuccess,
}: {
  zones: DeliveryZone[];
  zoneId: string;
  onZoneChange: (id: string) => void;
  quote: CartQuote | null;
  quoteLoading: boolean;
  onQuote: (q: CartQuote) => void;
  onSuccess: (s: SuccessState) => void;
}) {
  const { locale, dict } = useI18n();
  const { items } = useCart();
  const t = dict.checkout;
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (fd: FormData): FieldErrors => {
    const e: FieldErrors = {};
    const name = String(fd.get("customer_name") ?? "").trim();
    const phone = String(fd.get("customer_phone") ?? "").replace(/[\s.\-()]/g, "");
    const address = String(fd.get("delivery_address") ?? "").trim();
    const notes = String(fd.get("customer_notes") ?? "");
    if (name.length < 2) e.name = t.errors.NAME_INVALID;
    if (!/^\+?[0-9]{7,15}$/.test(phone)) e.phone = t.errors.PHONE_INVALID;
    if (!zoneId) e.zone = t.errors.ZONE_INVALID;
    if (address.length < 2) e.address = t.errors.ADDRESS_INVALID;
    if (notes.length > 500) e.notes = t.errors.NOTES_TOO_LONG;
    return e;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const fieldErrors = validate(fd);
    setErrors(fieldErrors);
    setFormError(null);
    if (Object.keys(fieldErrors).length) {
      const firstKey = Object.keys(fieldErrors)[0];
      form.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)?.focus();
      return;
    }
    if (!quote || quote.has_issues) {
      setFormError(dict.cart.fixIssues);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: fd.get("customer_name"),
          customer_phone: fd.get("customer_phone"),
          delivery_zone_id: zoneId,
          delivery_address: fd.get("delivery_address"),
          customer_notes: fd.get("customer_notes") ?? "",
          website: fd.get("website") ?? "",
          locale,
          items: items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, quantity: i.quantity })),
          expected_priced_subtotal: quote.priced_subtotal,
          expected_delivery_fee: quote.delivery_fee,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.orderNumber) {
        onSuccess({ orderNumber: data.orderNumber, whatsappUrl: data.whatsappUrl, message: data.message });
        return;
      }
      if (data.quote) onQuote(data.quote as CartQuote);
      const code = (data.error as keyof typeof t.errors) || "GENERIC";
      setFormError(t.errors[code] ?? t.errors.GENERIC);
    } catch {
      setFormError(t.errors.GENERIC);
    } finally {
      setSubmitting(false);
    }
  };

  const err = (key: keyof FieldErrors) =>
    errors[key] ? (
      <p id={`err-${key}`} className="field-error">
        {errors[key]}
      </p>
    ) : null;

  const zoneLabel = (z: DeliveryZone) => (locale === "wo" && z.name_wo ? z.name_wo : z.name);
  const selectedZone = zones.find((z) => z.id === zoneId);
  const zoneDescription = selectedZone ? (locale === "wo" ? selectedZone.description_wo || selectedZone.description : selectedZone.description) : null;

  return (
    <section id="commande" aria-labelledby="checkout-title" className="card scroll-mt-28 p-5 sm:p-6">
      <h2 id="checkout-title" className="font-display text-lg font-extrabold">
        {t.title}
      </h2>
      <p className="mt-1 text-sm text-muted">{t.intro}</p>
      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        <div>
          <label htmlFor="customer_name" className="field-label">
            {t.name} <span aria-hidden="true">*</span>
          </label>
          <input
            id="customer_name"
            name="customer_name"
            data-field="name"
            autoComplete="name"
            required
            maxLength={120}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "err-name" : undefined}
            className="field"
          />
          {err("name")}
        </div>
        <div>
          <label htmlFor="customer_phone" className="field-label">
            {t.phone} <span aria-hidden="true">*</span>
          </label>
          <input
            id="customer_phone"
            name="customer_phone"
            data-field="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={30}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "err-phone phone-help" : "phone-help"}
            className="field"
          />
          <p id="phone-help" className="mt-1 text-xs text-muted">
            {t.phoneHelp}
          </p>
          {err("phone")}
        </div>
        <div>
          <label htmlFor="delivery_zone" className="field-label">
            {t.zone} <span aria-hidden="true">*</span>
          </label>
          <select
            id="delivery_zone"
            data-field="zone"
            value={zoneId}
            onChange={(e) => onZoneChange(e.target.value)}
            required
            aria-invalid={!!errors.zone}
            aria-describedby={errors.zone ? "err-zone" : zoneDescription ? "zone-help" : undefined}
            className="field"
          >
            <option value="">{t.zonePlaceholder}</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {zoneLabel(z)}
              </option>
            ))}
          </select>
          {zoneDescription && (
            <p id="zone-help" className="mt-1 text-xs text-muted">
              {zoneDescription}
            </p>
          )}
          {err("zone")}
        </div>
        <div>
          <label htmlFor="delivery_address" className="field-label">
            {t.address} <span aria-hidden="true">*</span>
          </label>
          <input
            id="delivery_address"
            name="delivery_address"
            data-field="address"
            autoComplete="street-address"
            required
            maxLength={300}
            placeholder={t.addressPlaceholder}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? "err-address" : undefined}
            className="field"
          />
          {err("address")}
        </div>
        <div>
          <label htmlFor="customer_notes" className="field-label">
            {t.notes}
          </label>
          <textarea
            id="customer_notes"
            name="customer_notes"
            data-field="notes"
            rows={3}
            maxLength={500}
            placeholder={t.notesPlaceholder}
            aria-invalid={!!errors.notes}
            className="field resize-y"
          />
          {err("notes")}
        </div>
        {/* Champ piège pour les robots : invisible pour les humains. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Site web</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#fdecea] p-3 text-sm font-medium text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {formError}
          </p>
        )}
        <button type="submit" disabled={submitting || quoteLoading} className="btn btn-whatsapp w-full">
          {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <WhatsAppIcon />}
          {submitting ? t.submitting : t.submit}
        </button>
        <p className="text-xs leading-relaxed text-muted">{dict.product.paymentNote}</p>
        <p className="text-xs leading-relaxed text-muted">
          {t.privacy}{" "}
          <Link href={paths.privacy(locale)} className="link">
            {t.privacyLink}
          </Link>
        </p>
      </form>
    </section>
  );
}

function SuccessPanel({ success, onDone }: { success: SuccessState; onDone: () => void }) {
  const { locale, dict } = useI18n();
  const t = dict.checkout;
  const [copied, setCopied] = useState(false);
  return (
    <div className="card mx-auto max-w-2xl p-6 text-center sm:p-10" role="status" aria-live="polite">
      <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">{t.successTitle}</h2>
      <p className="mt-3 text-muted">{format(t.successText, { ref: success.orderNumber })}</p>
      <p className="mt-4 inline-block rounded-full bg-paper px-4 py-2 font-mono text-sm font-bold tracking-wider">{success.orderNumber}</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a href={success.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
          <WhatsAppIcon /> {t.openWhatsapp}
        </a>
        <button
          type="button"
          className="btn btn-outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(success.message);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          <Copy className="size-4" aria-hidden="true" /> {copied ? t.copied : t.copyMessage}
        </button>
      </div>
      <p className="mx-auto mt-6 max-w-md rounded-2xl bg-[#fff8e8] p-4 text-sm leading-relaxed text-warning">{t.whatsappNote}</p>
      <Link href={paths.shop(locale)} onClick={onDone} className="link mt-6 inline-block text-sm">
        {t.newOrder}
      </Link>
    </div>
  );
}
