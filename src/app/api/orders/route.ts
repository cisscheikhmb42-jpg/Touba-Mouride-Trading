import { NextResponse } from "next/server";
import { getPublicSupabase } from "@/lib/supabase/public";
import { orderRequestSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getDictionary } from "@/i18n/dictionaries";
import { getStoreSettings } from "@/lib/data/catalog";
import { buildOrderMessage, generateOrderNumber, whatsappUrl } from "@/lib/whatsapp";
import type { CartQuote } from "@/lib/types";

const KNOWN_ERRORS = new Set([
  "NAME_INVALID",
  "PHONE_INVALID",
  "ADDRESS_INVALID",
  "ZONE_INVALID",
  "NOTES_TOO_LONG",
  "CART_EMPTY",
  "CART_INVALID",
  "PRICE_CHANGED",
  "RATE_LIMITED",
]);

/**
 * Enregistre une DEMANDE de commande (statut « en attente de
 * confirmation ») puis renvoie le lien WhatsApp prérempli. Aucun prix
 * venant du navigateur n'est utilisé : tout est recalculé en base.
 */
export async function POST(request: Request) {
  if (!rateLimit(`order:${clientIp(request)}`, 8, 10 * 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  const supabase = getPublicSupabase();
  if (!supabase) return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    const code = parsed.error.issues.find((i) => KNOWN_ERRORS.has(i.message))?.message;
    return NextResponse.json({ error: code ?? "GENERIC" }, { status: 400 });
  }
  const input = parsed.data;
  if (input.website) return NextResponse.json({ error: "GENERIC" }, { status: 400 });

  const items = input.items.map((i) => ({ ...i, variant_id: i.variant_id ?? null }));

  // 1. Devis de référence (base de données).
  const quoteRes = await supabase.rpc("quote_cart", {
    p_items: items,
    p_delivery_zone_id: input.delivery_zone_id,
  });
  if (quoteRes.error) {
    console.error("[orders] quote", quoteRes.error.message);
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }
  const quote = quoteRes.data as CartQuote;
  if (!quote.zone) return NextResponse.json({ error: "ZONE_INVALID" }, { status: 400 });
  if (quote.has_issues) return NextResponse.json({ error: "CART_INVALID", quote }, { status: 409 });
  if (
    quote.priced_subtotal !== input.expected_priced_subtotal ||
    (quote.delivery_fee ?? null) !== (input.expected_delivery_fee ?? null)
  ) {
    return NextResponse.json({ error: "PRICE_CHANGED", quote }, { status: 409 });
  }

  // 2. Message WhatsApp construit à partir du devis serveur.
  const dict = getDictionary(input.locale);
  const settings = await getStoreSettings();
  const zoneName = input.locale === "wo" && quote.zone.name_wo ? quote.zone.name_wo : quote.zone.name;

  // 3. Enregistrement (la base revérifie tout et refuse si un montant a changé).
  for (let attempt = 0; attempt < 3; attempt++) {
    const orderNumber = generateOrderNumber();
    const message = buildOrderMessage({
      orderNumber,
      customerName: input.customer_name,
      customerPhone: input.customer_phone,
      zoneName,
      address: input.delivery_address,
      notes: input.customer_notes,
      quote,
      locale: input.locale,
      dict,
    });
    const { data, error } = await supabase.rpc("create_order", {
      p_payload: {
        order_number: orderNumber,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        delivery_zone_id: input.delivery_zone_id,
        delivery_address: input.delivery_address,
        customer_notes: input.customer_notes,
        locale: input.locale,
        whatsapp_message: message,
        expected_priced_subtotal: quote.priced_subtotal,
        expected_delivery_fee: quote.delivery_fee,
        items,
      },
    });
    if (!error && data) {
      return NextResponse.json(
        {
          orderNumber: (data as { order_number: string }).order_number,
          message,
          whatsappUrl: whatsappUrl(settings.whatsapp_number, message),
        },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (error?.message === "ORDER_NUMBER_TAKEN") continue;
    const code = error && KNOWN_ERRORS.has(error.message) ? error.message : "GENERIC";
    if (code === "GENERIC") console.error("[orders] create", error?.message);
    return NextResponse.json({ error: code }, { status: code === "GENERIC" ? 500 : 409 });
  }
  return NextResponse.json({ error: "GENERIC" }, { status: 500 });
}
