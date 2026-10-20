import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { ActionForm, ConfirmSubmit } from "@/components/admin/action-form";
import { Checkbox, Field, Panel } from "@/components/admin/fields";
import { ProductImageUploader } from "@/components/admin/image-uploader";
import { deleteImage, deleteProduct, deleteVariant, moveImage, saveVariant, updateImage } from "../../../actions";
import { ProductForm } from "../product-form";
import { AiDescriptionHelper } from "@/components/admin/ai-description";
import { isAiConfigured } from "@/lib/ai";

export const metadata: Metadata = { title: "Modifier le produit" };

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/produits/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, product_images(*), product_variants(*)").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name_fr").order("sort_order"),
  ]);
  if (!product) notFound();
  const images = [...product.product_images].sort((a, b) => a.position - b.position);
  const variants = [...product.product_variants].sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/produits" className="link text-sm">
        ← Produits
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">{product.name_fr}</h1>
        {product.is_published && (
          <Link href={`/fr/produit/${product.slug}`} target="_blank" className="btn btn-outline">
            <ExternalLink className="size-4" aria-hidden="true" /> Voir sur le site
          </Link>
        )}
      </div>
      {sp.cree && <p role="status" className="text-sm font-semibold text-success">Produit créé. Ajoutez maintenant les photos et les variantes.</p>}

      <ProductForm product={product} categories={categories ?? []} />

      {isAiConfigured && (
        <Panel title="Assistant de rédaction (IA)" description="Propose un brouillon à partir des seules informations fournies. Relisez et corrigez toujours avant publication.">
          <AiDescriptionHelper productId={product.id} />
        </Panel>
      )}

      <Panel title="Photos" description="La première photo sert de vignette. Renseignez un texte alternatif descriptif (accessibilité et référencement).">
        {images.length > 0 && (
          <ul className="mb-5 space-y-3">
            {images.map((img, i) => (
              <li key={img.id} className="flex flex-col gap-3 rounded-2xl border border-line p-3 sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt="" className="size-28 shrink-0 rounded-xl bg-paper object-cover" />
                <div className="flex-1">
                  <ActionForm action={updateImage} submitLabel="Enregistrer le texte">
                    <input type="hidden" name="id" value={img.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Texte alternatif (FR)" name="alt_text_fr" defaultValue={img.alt_text_fr} />
                      <Field label="Texte alternatif (WO)" name="alt_text_wo" defaultValue={img.alt_text_wo} />
                    </div>
                  </ActionForm>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <form action={moveImage}>
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="product_id" value={product.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button disabled={i === 0} className="inline-flex items-center gap-1 text-sm font-semibold disabled:opacity-40">
                        <ArrowUp className="size-4" aria-hidden="true" /> Monter
                      </button>
                    </form>
                    <form action={moveImage}>
                      <input type="hidden" name="id" value={img.id} />
                      <input type="hidden" name="product_id" value={product.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button disabled={i === images.length - 1} className="inline-flex items-center gap-1 text-sm font-semibold disabled:opacity-40">
                        <ArrowDown className="size-4" aria-hidden="true" /> Descendre
                      </button>
                    </form>
                    <form action={deleteImage}>
                      <input type="hidden" name="id" value={img.id} />
                      <ConfirmSubmit label="Supprimer la photo" confirm="Supprimer définitivement cette photo ?" />
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <ProductImageUploader productId={product.id} defaultAlt={product.name_fr} />
      </Panel>

      <Panel
        title="Variantes (tailles, pointures, couleurs)"
        description="N'ajoutez que les variantes réellement disponibles. Prix vide = prix du produit. Le stock n'est utilisé que si « Suivre le stock » est coché."
      >
        <ul className="space-y-3">
          {variants.map((v) => (
            <li key={v.id} className="rounded-2xl border border-line p-4">
              <ActionForm action={saveVariant} submitLabel="Enregistrer">
                <VariantFields productId={product.id} v={v} />
              </ActionForm>
              <form action={deleteVariant} className="mt-2">
                <input type="hidden" name="id" value={v.id} />
                <ConfirmSubmit label="Supprimer la variante" confirm="Supprimer cette variante ?" />
              </form>
            </li>
          ))}
          <li className="rounded-2xl border-2 border-dashed border-line p-4">
            <p className="mb-3 font-display text-sm font-bold">Nouvelle variante</p>
            <ActionForm action={saveVariant} submitLabel="Ajouter la variante">
              <VariantFields productId={product.id} />
            </ActionForm>
          </li>
        </ul>
      </Panel>

      <Panel title="Zone sensible">
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <ConfirmSubmit
            label="Supprimer ce produit"
            confirm="Supprimer définitivement ce produit, ses photos et ses variantes ? Les commandes passées conservent leur historique."
          />
        </form>
      </Panel>
    </div>
  );
}

function VariantFields({
  productId,
  v,
}: {
  productId: string;
  v?: { id: string; size: string | null; color: string | null; sku: string | null; price: number | null; stock_quantity: number; is_available: boolean; position: number };
}) {
  return (
    <>
      <input type="hidden" name="product_id" value={productId} />
      {v && <input type="hidden" name="id" value={v.id} />}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Taille / pointure" name="size" defaultValue={v?.size} />
        <Field label="Couleur" name="color" defaultValue={v?.color} />
        <Field label="Référence" name="sku" defaultValue={v?.sku} />
        <Field label="Prix (FCFA)" name="price" defaultValue={v?.price} inputMode="numeric" placeholder="= produit" />
        <Field label="Stock" name="stock_quantity" defaultValue={v?.stock_quantity ?? 0} inputMode="numeric" />
        <Field label="Ordre" name="position" defaultValue={v?.position ?? 0} inputMode="numeric" />
      </div>
      <div className="mt-3 max-w-xs">
        <Checkbox label="Disponible" name="is_available" defaultChecked={v?.is_available ?? true} />
      </div>
    </>
  );
}
