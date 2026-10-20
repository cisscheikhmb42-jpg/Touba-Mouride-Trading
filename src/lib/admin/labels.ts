import type { OrderStatus } from "@/lib/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  awaiting_confirmation: "En attente de confirmation",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const STATUS_TONES: Record<OrderStatus, string> = {
  pending: "bg-paper text-ink-soft",
  awaiting_confirmation: "bg-[#fff4de] text-warning",
  confirmed: "bg-brand-50 text-brand-800",
  preparing: "bg-brand-50 text-brand-800",
  shipped: "bg-[#eef2ff] text-[#3730a3]",
  delivered: "bg-[#e7f5ec] text-success",
  cancelled: "bg-[#fdecea] text-danger",
};

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Dakar" }).format(new Date(iso));
}
