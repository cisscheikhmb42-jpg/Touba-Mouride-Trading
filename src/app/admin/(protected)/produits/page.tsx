import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { formatFCFA } from "@/lib/format";
import { normalize } from "@/lib/search";

export const metadata: Metadata = { title: "Produits" };

type Row = {
  id: string;
  name_fr: string;
  slug: string;
  price: number | null;
  sku: string | null;
  stock_quantity: number;
  track_inventory: boolean;
  low_stock_threshold: number;
  is_available: boolean;
  is_published: boolean;
  is_featured: boolean;
  search_text: string;
  categories: { name_fr: string } | null;
  product_images: { image_url: string; position: number }[];
  product_variants: { stock_quantity: number }[];
};

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/produits">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const filter = typeof sp.filtre === "string" ? sp.filtre : "";
  const { data, error } = await supabase
    .from("products")
    .select("id, name_fr, slug, price, sku, stock_quantity, track_inventory, low_stock_threshold, is_available, is_published, is_featured, search_text, categories(name_fr), product_images(image_url, position), product_variants(stock_quantity)")
    .order("created_at", { ascending: false });
  if (error) return <p className="text-danger">{error.message}</p>;

  const stockOf = (p: Row) => (p.product_variants.length ? p.product_variants.reduce((s, v) => s + v.stock_quantity, 0) : p.stock_quantity);
  const lowStock = (p: Row) =>
    p.track_inventory &&
    (p.product_variants.length ? p.product_variants.some((v) => v.stock_quantity <= p.low_stock_threshold) : p.stock_quantity <= p.low_stock_threshold);
  let rows = (data as unknown as Row[]) ?? [];
  if (q) rows = rows.filter((p) => p.search_text.includes(normalize(q)));
  if (filter === "stock") rows = rows.filter(lowStock);
  if (filter === "brouillons") rows = rows.filter((p) => !p.is_published);
  if (filter === "sans-prix") rows = rows.filter((p) => p.price === null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Produits</h1>
        <Link href="/admin/produits/nouveau" className="btn btn-primary">
          <Plus className="size-4" aria-hidden="true" /> Ajouter un produit
        </Link>
      </div>
      {sp.supprime && <p role="status" className="text-sm font-semibold text-success">Produit supprimé.</p>}
      <form className="flex flex-wrap gap-2" method="get">
        <label htmlFor="q" className="sr-only">
          Rechercher
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Rechercher un produit, une référence…" className="field max-w-xs" />
        <label htmlFor="filtre" className="sr-only">
          Filtre
        </label>
        <select id="filtre" name="filtre" defaultValue={filter} className="field max-w-[14rem]">
          <option value="">Tous les produits</option>
          <option value="stock">Alertes de stock</option>
          <option value="brouillons">Brouillons (non publiés)</option>
          <option value="sans-prix">Sans prix</option>
        </select>
        <button className="btn btn-dark">Filtrer</button>
      </form>

      {rows.length === 0 ? (
        <p className="card p-8 text-center text-muted">Aucun produit. Commencez par « Ajouter un produit ».</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-line text-left text-xs text-muted uppercase">
              <tr>
                <th className="p-3">Produit</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Prix</th>
                <th className="p-3">Stock</th>
                <th className="p-3">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const img = [...p.product_images].sort((a, b) => a.position - b.position)[0];
                return (
                  <tr key={p.id} className="hover:bg-paper">
                    <td className="p-3">
                      <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3 font-semibold hover:underline">
                        <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                          {img && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img.image_url} alt="" className="size-full object-cover" />
                          )}
                        </span>
                        <span>
                          {p.name_fr}
                          {p.sku && <span className="block text-xs font-normal text-muted">{p.sku}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="p-3 text-muted">{p.categories?.name_fr ?? "—"}</td>
                    <td className="p-3">{p.price !== null ? formatFCFA(p.price) : <span className="text-gold-deep">À confirmer</span>}</td>
                    <td className="p-3">
                      {p.track_inventory ? (
                        <span className={lowStock(p) ? "font-bold text-warning" : ""}>{stockOf(p)}</span>
                      ) : (
                        <span className="text-muted">Non suivi</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="flex flex-wrap gap-1">
                        <Badge on={p.is_published} yes="Publié" no="Brouillon" />
                        <Badge on={p.is_available} yes="Disponible" no="Indisponible" />
                        {p.is_featured && <Badge on yes="Sélection" no="" />}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Badge({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${on ? "bg-[#e7f5ec] text-success" : "bg-paper text-muted"}`}>
      {on ? yes : no}
    </span>
  );
}
