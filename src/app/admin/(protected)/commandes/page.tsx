import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { STATUS_LABELS, STATUS_TONES, formatDateTime } from "@/lib/admin/labels";
import { formatFCFA } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Commandes" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/commandes">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.statut === "string" && ORDER_STATUSES.includes(sp.statut as OrderStatus) ? (sp.statut as OrderStatus) : null;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, delivery_zone_name, status, total, priced_subtotal, has_unpriced_items, delivery_fee_status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (q) {
    const safe = q.replace(/[%,()*]/g, "");
    query = query.or(`order_number.ilike.%${safe}%,customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`);
  }
  const { data: orders, error } = await query;
  if (error) return <p className="text-danger">{error.message}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Commandes</h1>
      <p className="text-sm text-muted">
        Une demande arrive « En attente de confirmation ». Le client doit encore appuyer sur « Envoyer » dans WhatsApp : vérifiez
        la réception du message avant de confirmer. Le stock est retiré à la confirmation.
      </p>
      <form method="get" className="flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">
          Rechercher
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Référence, nom, téléphone…" className="field max-w-xs" />
        <label htmlFor="statut" className="sr-only">
          Statut
        </label>
        <select id="statut" name="statut" defaultValue={status ?? ""} className="field max-w-[16rem]">
          <option value="">Tous les statuts</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button className="btn btn-dark">Filtrer</button>
      </form>
      {!orders || orders.length === 0 ? (
        <p className="card p-8 text-center text-muted">Aucune commande.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="border-b border-line text-left text-xs text-muted uppercase">
              <tr>
                <th className="p-3">Référence</th>
                <th className="p-3">Date</th>
                <th className="p-3">Client</th>
                <th className="p-3">Zone</th>
                <th className="p-3">Total</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-paper">
                  <td className="p-3">
                    <Link href={`/admin/commandes/${o.id}`} className="font-mono font-bold hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="p-3 whitespace-nowrap text-muted">{formatDateTime(o.created_at)}</td>
                  <td className="p-3">
                    {o.customer_name}
                    <span className="block text-xs text-muted">{o.customer_phone}</span>
                  </td>
                  <td className="p-3">{o.delivery_zone_name}</td>
                  <td className="p-3 whitespace-nowrap">
                    {o.total !== null ? (
                      formatFCFA(o.total)
                    ) : (
                      <span className="text-gold-deep">
                        À confirmer
                        <span className="block text-xs text-muted">
                          {formatFCFA(o.priced_subtotal)} connus{o.has_unpriced_items ? " · prix manquants" : ""}
                          {o.delivery_fee_status === "to_confirm" ? " · frais à confirmer" : ""}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STATUS_TONES[o.status as OrderStatus]}`}>
                      {STATUS_LABELS[o.status as OrderStatus]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
