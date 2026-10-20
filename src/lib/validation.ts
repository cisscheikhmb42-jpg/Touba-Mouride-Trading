import { z } from "zod";

const uuid = z.guid();

export const cartItemSchema = z.object({
  product_id: uuid,
  variant_id: uuid.nullable().optional(),
  quantity: z.number().int().min(1).max(99),
});

export const cartItemsSchema = z.array(cartItemSchema).min(1).max(50);

export const quoteRequestSchema = z.object({
  items: cartItemsSchema,
  delivery_zone_id: uuid.nullable().optional(),
});

/** Téléphone : chiffres, espaces, +, -, ., () ; 7 à 15 chiffres. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.\-()]/g, ""))
  .refine((v) => /^\+?[0-9]{7,15}$/.test(v), { message: "PHONE_INVALID" });

export const orderRequestSchema = z.object({
  customer_name: z.string().trim().min(2, "NAME_INVALID").max(120, "NAME_INVALID"),
  customer_phone: phoneSchema,
  delivery_zone_id: z.guid("ZONE_INVALID"),
  delivery_address: z.string().trim().min(2, "ADDRESS_INVALID").max(300, "ADDRESS_INVALID"),
  customer_notes: z.string().trim().max(500, "NOTES_TOO_LONG").optional().default(""),
  locale: z.enum(["fr", "wo"]).default("fr"),
  items: cartItemsSchema,
  /** Montants affichés au client : revérifiés en base. */
  expected_priced_subtotal: z.number().int().nonnegative(),
  expected_delivery_fee: z.number().int().nonnegative().nullable(),
  /** Champ piège anti-robot : doit rester vide. */
  website: z.string().max(0).optional().default(""),
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;
