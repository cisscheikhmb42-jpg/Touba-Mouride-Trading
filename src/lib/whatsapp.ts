import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CartQuote } from "@/lib/types";
import { formatFCFA } from "@/lib/format";

export function whatsappUrl(number: string, text?: string): string {
  const base = `https://wa.me/${number.replace(/[^0-9]/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export type OrderMessageInput = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  zoneName: string;
  address: string;
  notes?: string | null;
  quote: CartQuote;
  locale: Locale;
  dict: Dictionary;
};

/**
 * Message prérempli de demande de commande. Construit à partir du devis
 * calculé par la base (jamais à partir des prix du navigateur).
 */
export function buildOrderMessage(input: OrderMessageInput): string {
  const w = input.dict.whatsapp;
  const money = (n: number) => formatFCFA(n, { plain: true });
  const lines: string[] = [
    `*${w.header}*`,
    `*${w.title}*`,
    "",
    `${w.reference} : ${input.orderNumber}`,
    `${w.name} : ${input.customerName}`,
    `${w.phone} : ${input.customerPhone}`,
    `${w.zone} : ${input.zoneName}`,
    `${w.address} : ${input.address}`,
    "",
    `*${w.items}*`,
  ];

  input.quote.lines.forEach((line, index) => {
    const name = (input.locale === "wo" ? line.name_wo : line.name_fr) || line.name_fr || "";
    const title = line.variant_label ? `${name} — ${line.variant_label}` : name;
    lines.push(`${index + 1}. ${title}${line.sku ? ` (${line.sku})` : ""}`);
    lines.push(`   ${w.quantity} : ${line.quantity}`);
    if (line.unit_price !== null) {
      lines.push(`   ${w.unitPrice} : ${money(line.unit_price)}`);
      if (line.line_total !== null) lines.push(`   ${w.lineTotal} : ${money(line.line_total)}`);
    } else {
      lines.push(`   ${w.unitPrice} : ${w.priceToConfirm}`);
    }
  });

  const q = input.quote;
  lines.push("");
  if (q.has_unpriced_items) {
    lines.push(`${w.subtotalPartial} : ${money(q.priced_subtotal)}`);
  } else {
    lines.push(`${w.subtotal} : ${money(q.priced_subtotal)}`);
  }
  lines.push(
    `${w.deliveryFee} : ${q.delivery_fee_status === "known" && q.delivery_fee !== null ? money(q.delivery_fee) : w.toConfirm}`,
  );
  lines.push(`*${w.total} : ${q.total !== null ? money(q.total) : w.toConfirm}*`);

  if (input.notes) {
    lines.push("", `${w.notes} : ${input.notes}`);
  }
  lines.push("", w.footer);
  return lines.join("\n");
}

/** Référence lisible : TMT-AAMMJJ-XXXX (sans caractères ambigus). */
export function generateOrderNumber(now = new Date()): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  const yy = String(now.getUTCFullYear()).slice(2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `TMT-${yy}${mm}${dd}-${suffix}`;
}
