import { NextResponse } from "next/server";
import { getPublicSupabase } from "@/lib/supabase/public";
import { quoteRequestSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { CartQuote } from "@/lib/types";

/** Devis du panier : prix, stocks et frais recalculés par Supabase. */
export async function POST(request: Request) {
  if (!rateLimit(`quote:${clientIp(request)}`, 120, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  const supabase = getPublicSupabase();
  if (!supabase) return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "CART_MALFORMED" }, { status: 400 });

  const { data, error } = await supabase.rpc("quote_cart", {
    p_items: parsed.data.items.map((i) => ({ ...i, variant_id: i.variant_id ?? null })),
    p_delivery_zone_id: parsed.data.delivery_zone_id ?? null,
  });
  if (error) {
    console.error("[quote]", error.message);
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }
  return NextResponse.json({ quote: data as CartQuote }, { headers: { "Cache-Control": "no-store" } });
}
