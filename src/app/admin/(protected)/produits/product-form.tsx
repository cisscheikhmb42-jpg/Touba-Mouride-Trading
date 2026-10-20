import { ActionForm } from "@/components/admin/action-form";
import { Checkbox, Field, Panel, TextArea } from "@/components/admin/fields";
import { saveProduct } from "../../actions";

type ProductLike = {
  id?: string;
  name_fr?: string;
  name_wo?: string;
  slug?: string;
  category_id?: string | null;
  description_fr?: string | null;
  description_wo?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  sku?: string | null;
  stock_quantity?: number;
  track_inventory?: boolean;
  low_stock_threshold?: number;
  is_available?: boolean;
  is_featured?: boolean;
  is_published?: boolean;
  video_url?: string | null;
  seo_title_fr?: string | null;
  seo_title_wo?: string | null;
  seo_description_fr?: string | null;
  seo_description_wo?: string | null;
};

export function ProductForm({ product = {}, categories }: { product?: ProductLike; categories: { id: string; name_fr: string }[] }) {
  return (
    <ActionForm action={saveProduct} submitLabel={product.id ? "Enregistrer le produit" : "Créer le produit"} className="space-y-6">
      {product.id && <input type="hidden" name="id" value={product.id} />}
      <Panel title="Informations">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom (français)" name="name_fr" defaultValue={product.name_fr} required maxLength={160} />
          <Field label="Nom (wolof)" name="name_wo" defaultValue={product.name_wo} help="Laissé vide : le nom français est utilisé." maxLength={160} />
          <Field label="Slug (URL)" name="slug" defaultValue={product.slug} help="Ex. jallabe-brode-blanc. Vide : généré depuis le nom." />
          <div>
            <label htmlFor="f-category_id" className="field-label">
              Catégorie
            </label>
            <select id="f-category_id" name="category_id" defaultValue={product.category_id ?? ""} className="field">
              <option value="">— Aucune —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_fr}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Description (français)" name="description_fr" defaultValue={product.description_fr} rows={6} />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Description (wolof)" name="description_wo" defaultValue={product.description_wo} rows={4} />
          </div>
        </div>
      </Panel>

      <Panel title="Prix et stock" description="Prix en FCFA, nombres entiers. Laissez le prix vide pour afficher « Prix à confirmer ».">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Prix (FCFA)" name="price" defaultValue={product.price} inputMode="numeric" placeholder="Prix à confirmer" />
          <Field label="Prix barré (facultatif)" name="compare_at_price" defaultValue={product.compare_at_price} inputMode="numeric" help="Doit être supérieur au prix." />
          <Field label="Référence (SKU)" name="sku" defaultValue={product.sku} />
          <Field
            label="Stock (sans variantes)"
            name="stock_quantity"
            defaultValue={product.stock_quantity ?? 0}
            inputMode="numeric"
            help="Si le produit a des variantes, le stock se gère par variante."
          />
          <Field label="Seuil d'alerte de stock" name="low_stock_threshold" defaultValue={product.low_stock_threshold ?? 3} inputMode="numeric" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Checkbox
            label="Suivre le stock"
            name="track_inventory"
            defaultChecked={product.track_inventory ?? false}
            help="Le site affiche le stock réel et refuse les quantités supérieures."
          />
          <Checkbox label="Disponible à la commande" name="is_available" defaultChecked={product.is_available ?? true} />
          <Checkbox label="Publié sur le site" name="is_published" defaultChecked={product.is_published ?? false} help="Décoché : brouillon invisible des visiteurs." />
          <Checkbox label="Mettre en avant (« Notre sélection »)" name="is_featured" defaultChecked={product.is_featured ?? false} />
        </div>
      </Panel>

      <Panel title="Vidéo (facultatif)" description="Lien https vers une vidéo MP4 (ex. envoyée dans le bucket « videos » de Supabase, 50 Mo max).">
        <Field label="URL de la vidéo" name="video_url" defaultValue={product.video_url} type="url" placeholder="https://…" />
      </Panel>

      <Panel title="Référencement (SEO)" description="Facultatif : par défaut, le nom et la description sont utilisés.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre SEO (français)" name="seo_title_fr" defaultValue={product.seo_title_fr} maxLength={70} />
          <Field label="Titre SEO (wolof)" name="seo_title_wo" defaultValue={product.seo_title_wo} maxLength={70} />
          <TextArea label="Meta description (français)" name="seo_description_fr" defaultValue={product.seo_description_fr} rows={3} help="Environ 150 caractères." />
          <TextArea label="Meta description (wolof)" name="seo_description_wo" defaultValue={product.seo_description_wo} rows={3} />
        </div>
      </Panel>
    </ActionForm>
  );
}
