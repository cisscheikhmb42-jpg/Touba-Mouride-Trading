import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { STATUS_LABELS, STATUS_TONES, formatDateTime } from "@/lib/admin/labels";
import { formatFCFA } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Tableau de bord" };

type Stats = {
  products_total: number;
  products_published: number;
  products_available: number;
  products_unavailable: number;
  products_without_price: number;
  products_without_image: number;
  low_stock: number;
  orders_by_status: Partial<Record<OrderStatus, number>>;
  orders_last_7_days: number;
};

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const [{ data: stats, error }, { data: recent }] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, status, total, priced_subtotal, has_unpriced_items, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  if (error || !stats) return <p className="text-danger">Impossible de charger les statistiques : {error?.message}</p>;
  const s = stats as Stats;
  const awaiting = s.orders_by_status.awaiting_confirmation ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">Tableau de bord</h1>

      {awaiting > 0 && (
        <Link href="/admin/commandes?statut=awaiting_confirmation" className="flex items-center gap-3 rounded-2xl bg-[#fff4de] p-4 font-semibold text-warning">
          <AlertTriangle className="size-5" aria-hidden="true" /> {awaiting} demande(s) de commande en attente de confirmation
        </Link>
      )}

      <section aria-labelledby="stats-products">
        <h2 id="stats-products" className="mb-3 font-display font-bold">
          Produits
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Stat label="Produits" value={s.products_total} href="/admin/produits" />
          <Stat label="Publiés" value={s.products_published} />
          <Stat label="Disponibles" value={s.products_available} />
          <Stat label="Indisponibles" value={s.products_unavailable} tone={s.products_unavailable ? "warn" : undefined} />
          <Stat label="Alertes de stock" value={s.low_stock} tone={s.low_stock ? "warn" : undefined} href="/admin/produits?filtre=stock" />
          <Stat label="Sans prix" value={s.products_without_price} tone={s.products_without_price ? "warn" : undefined} />
        </dl>
        {s.products_without_image > 0 && (
          <p className="mt-3 text-sm text-muted">{s.products_without_image} produit(s) sans photo.</p>
        )}
      </section>

      <section aria-labelledby="stats-orders">
        <h2 id="stats-orders" className="mb-3 font-display font-bold">
          Commandes par statut <span className="font-normal text-muted">· {s.orders_last_7_days} sur 7 jours</span>
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {ORDER_STATUSES.map((st) => (
            <Stat key={st} label={STATUS_LABELS[st]} value={s.orders_by_status[st] ?? 0} href={`/admin/commandes?statut=${st}`} />
          ))}
        </dl>
      </section>

      <section aria-labelledby="recent-orders" className="card overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 id="recent-orders" className="font-display font-bold">
            Dernières demandes
          </h2>
          <Link href="/admin/commandes" className="link text-sm">
            Toutes les commandes
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <ul className="divide-y divide-line border-t border-line">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/commandes/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-paper">
                  <span>
                    <span className="font-mono text-sm font-bold">{o.order_number}</span>
                    <span className="ml-2 text-sm text-muted">{o.customer_name}</span>
                  </span>
                  <span className="flex items-center gap-3 text-sm">
                    <span className="text-muted">{formatDateTime(o.created_at)}</span>
                    <span className="font-semibold">{o.total !== null ? formatFCFA(o.total) : "Total à confirmer"}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONES[o.status as OrderStatus]}`}>
                      {STATUS_LABELS[o.status as OrderStatus]}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-line p-5 text-sm text-muted">Aucune demande de commande pour le moment.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, href, tone }: { label: string; value: number; href?: string; tone?: "warn" }) {
  return (
    <div className={`card relative h-full p-4 ${tone === "warn" ? "border-[#f3d9a6] bg-[#fffaf0]" : ""} ${href ? "hover:border-ink" : ""}`}>
      <dt className="text-xs font-semibold text-muted">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0">
            {label}
          </Link>
        ) : (
          label
        )}
      </dt>
      <dd className="mt-1 font-display text-2xl font-extrabold">{value}</dd>
    </div>
  );
}
