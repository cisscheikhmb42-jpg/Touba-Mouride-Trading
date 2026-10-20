import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { formatFCFA } from "@/lib/format";
import { ActionForm, ConfirmSubmit } from "@/components/admin/action-form";
import { Checkbox, Field } from "@/components/admin/fields";
import { deleteZone, saveZone } from "../../actions";

export const metadata: Metadata = { title: "Livraison" };

type Zone = {
  id: string;
  name: string;
  name_wo: string | null;
  description: string | null;
  description_wo: string | null;
  fee: number | null;
  estimated_delivery: string | null;
  estimated_delivery_wo: string | null;
  is_pickup: boolean;
  is_active: boolean;
  sort_order: number;
};

export default async function AdminDeliveryPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("delivery_zones").select("*").order("sort_order");
  if (error) return <p className="text-danger">{error.message}</p>;
  const zones = (data ?? []) as Zone[];
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-extrabold">Zones de livraison</h1>
      <p className="text-sm text-muted">
        Frais en FCFA. Laissez les frais vides pour afficher « Frais de livraison à confirmer sur WhatsApp » : aucun total ne sera alors
        calculé. Les délais sont indicatifs ; ne renseignez que des délais réels.
      </p>
      {zones.map((z) => (
        <section key={z.id} className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display font-bold">{z.name}</h2>
            <span className="text-sm text-muted">
              {z.fee !== null ? formatFCFA(z.fee) : "Frais à confirmer"} · {z.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <ActionForm action={saveZone}>
            <ZoneFields z={z} />
          </ActionForm>
          <form action={deleteZone} className="mt-3">
            <input type="hidden" name="id" value={z.id} />
            <ConfirmSubmit label="Supprimer la zone" confirm="Supprimer cette zone ? (Vous pouvez aussi simplement la désactiver.)" />
          </form>
        </section>
      ))}
      <section className="card border-2 border-dashed p-5">
        <h2 className="mb-4 font-display font-bold">Nouvelle zone</h2>
        <ActionForm action={saveZone} submitLabel="Ajouter la zone">
          <ZoneFields />
        </ActionForm>
      </section>
    </div>
  );
}

function ZoneFields({ z }: { z?: Zone }) {
  return (
    <>
      {z && <input type="hidden" name="id" value={z.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom (français)" name="name" defaultValue={z?.name} required />
        <Field label="Nom (wolof)" name="name_wo" defaultValue={z?.name_wo} />
        <Field label="Description (français)" name="description" defaultValue={z?.description} />
        <Field label="Description (wolof)" name="description_wo" defaultValue={z?.description_wo} />
        <Field label="Frais (FCFA)" name="fee" defaultValue={z?.fee} inputMode="numeric" placeholder="À confirmer" />
        <Field label="Ordre" name="sort_order" defaultValue={z?.sort_order ?? 0} inputMode="numeric" />
        <Field label="Délai indicatif (français)" name="estimated_delivery" defaultValue={z?.estimated_delivery} placeholder="Ex. 24 à 48 h" />
        <Field label="Délai indicatif (wolof)" name="estimated_delivery_wo" defaultValue={z?.estimated_delivery_wo} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Checkbox label="Zone active (proposée aux clients)" name="is_active" defaultChecked={z?.is_active ?? true} />
        <Checkbox label="Retrait sur place" name="is_pickup" defaultChecked={z?.is_pickup ?? false} />
      </div>
    </>
  );
}
