import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { STATUS_LABELS, STATUS_TONES, formatDateTime } from "@/lib/admin/labels";
import { formatFCFA } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { ActionForm } from "@/components/admin/action-form";
import { Field, Panel, TextArea } from "@/components/admin/fields";
import { WhatsAppIcon } from "@/components/ui/icons";
import { saveOrderNotes, setOrderDeliveryFee, updateOrderStatus } from "../../../actions";

export const metadata: Metadata = { title: "Commande" };

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/commandes/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();
  const status = order.status as OrderStatus;
  const phoneDigits = String(order.customer_phone).replace(/[^0-9]/g, "");
  const customerWa = phoneDigits.length === 9 ? `221${phoneDigits}` : phoneDigits;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/commandes" className="link text-sm">
        ← Commandes
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold sm:text-3xl">{order.order_number}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_TONES[status]}`}>{STATUS_LABELS[status]}</span>
      </div>
      <p className="text-sm text-muted">
        Reçue le {formatDateTime(order.created_at)} · langue : {order.locale === "wo" ? "wolof" : "français"}
        {order.stock_deducted ? " · stock retiré" : " · stock non retiré"}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Client">
          <dl className="space-y-2 text-sm">
            <Row label="Nom" value={order.customer_name} />
            <Row label="Téléphone" value={order.customer_phone} />
            <Row label="Zone" value={order.delivery_zone_name} />
            <Row label="Adresse / quartier" value={order.delivery_address} />
            {order.customer_notes && <Row label="Instructions" value={order.customer_notes} />}
          </dl>
          <a href={whatsappUrl(customerWa, `Bonjour ${order.customer_name}, au sujet de votre commande ${order.order_number} :`)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-5">
            <WhatsAppIcon /> Écrire au client
          </a>
        </Panel>

        <Panel title="Statut" description="Confirmer retire le stock des articles suivis ; annuler une commande confirmée le restitue.">
          <ActionForm action={updateOrderStatus} submitLabel="Mettre à jour le statut">
            <input type="hidden" name="id" value={order.id} />
            <label htmlFor="status" className="field-label">
              Nouveau statut
            </label>
            <select id="status" name="status" defaultValue={status} className="field">
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </ActionForm>
        </Panel>
      </div>

      <Panel title="Articles">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="border-b border-line text-left text-xs text-muted uppercase">
              <tr>
                <th className="py-2">Article</th>
                <th className="py-2">Qté</th>
                <th className="py-2">Prix unitaire</th>
                <th className="py-2 text-right">Sous-total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.order_items.map((it: { id: string; product_name: string; product_sku: string | null; variant_description: string | null; quantity: number; unit_price: number | null; line_total: number | null }) => (
                <tr key={it.id}>
                  <td className="py-2">
                    <span className="font-semibold">{it.product_name}</span>
                    {it.variant_description && <span className="block text-xs text-muted">{it.variant_description}</span>}
                    {it.product_sku && <span className="block text-xs text-muted">{it.product_sku}</span>}
                  </td>
                  <td className="py-2">{it.quantity}</td>
                  <td className="py-2">{it.unit_price !== null ? formatFCFA(it.unit_price) : <span className="text-gold-deep">À confirmer</span>}</td>
                  <td className="py-2 text-right">{it.line_total !== null ? formatFCFA(it.line_total) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          <Row label={order.has_unpriced_items ? "Sous-total (prix connus)" : "Sous-total"} value={formatFCFA(order.priced_subtotal)} />
          <Row label="Frais de livraison" value={order.delivery_fee !== null ? formatFCFA(order.delivery_fee) : "À confirmer"} />
          <Row label="Total" value={order.total !== null ? formatFCFA(order.total) : "À confirmer"} strong />
        </dl>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Frais de livraison" description="Renseignez les frais convenus avec le client. Vide = à confirmer.">
          <ActionForm action={setOrderDeliveryFee}>
            <input type="hidden" name="id" value={order.id} />
            <Field label="Frais (FCFA)" name="delivery_fee" defaultValue={order.delivery_fee} inputMode="numeric" />
          </ActionForm>
        </Panel>
        <Panel title="Notes internes" description="Visibles uniquement par les administrateurs.">
          <ActionForm action={saveOrderNotes}>
            <input type="hidden" name="id" value={order.id} />
            <TextArea label="Notes" name="internal_notes" defaultValue={order.internal_notes} rows={4} />
          </ActionForm>
        </Panel>
      </div>

      {order.whatsapp_message && (
        <Panel title="Message WhatsApp préparé" description="Message généré pour le client. Son envoi n'est pas garanti : vérifiez la réception dans WhatsApp.">
          <pre className="overflow-x-auto rounded-xl bg-paper p-4 text-xs leading-relaxed whitespace-pre-wrap">{order.whatsapp_message}</pre>
        </Panel>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right ${strong ? "font-display font-extrabold" : "font-semibold"}`}>{value}</dd>
    </div>
  );
}
