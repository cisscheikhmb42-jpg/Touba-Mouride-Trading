import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { ActionForm, ConfirmSubmit } from "@/components/admin/action-form";
import { Checkbox, Field, TextArea } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { deleteCategory, saveCategory, setCategoryImage } from "../../actions";

export const metadata: Metadata = { title: "Catégories" };

type Cat = {
  id: string;
  name_fr: string;
  name_wo: string;
  slug: string;
  description_fr: string | null;
  description_wo: string | null;
  seo_title_fr: string | null;
  seo_title_wo: string | null;
  seo_description_fr: string | null;
  seo_description_wo: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) return <p className="text-danger">{error.message}</p>;
  const categories = (data ?? []) as Cat[];
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-extrabold">Catégories</h1>
      <p className="text-sm text-muted">
        Les noms sont ceux fournis par la boutique. Modifier un slug change l&apos;adresse de la page (à éviter une fois le site indexé).
      </p>
      {categories.map((c) => (
        <details key={c.id} className="card group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display font-bold [&::-webkit-details-marker]:hidden">
            <span>
              {c.name_fr} <span className="text-sm font-normal text-muted">/{c.slug}</span>
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${c.is_active ? "bg-[#e7f5ec] text-success" : "bg-paper text-muted"}`}>
              {c.is_active ? "Active" : "Masquée"}
            </span>
          </summary>
          <div className="mt-5 space-y-5">
            <MediaField
              label="Image de la catégorie"
              kind="image"
              folder={`categories/${c.id}`}
              currentUrl={c.image_url}
              onSaved={setCategoryImage.bind(null, c.id)}
              maxSide={1200}
            />
            <ActionForm action={saveCategory}>
              <CategoryFields c={c} />
            </ActionForm>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmSubmit label="Supprimer la catégorie" confirm="Supprimer cette catégorie ? Ses produits resteront, sans catégorie." />
            </form>
          </div>
        </details>
      ))}
      <section className="card border-2 border-dashed p-5">
        <h2 className="font-display font-bold">Nouvelle catégorie</h2>
        <ActionForm action={saveCategory} submitLabel="Créer la catégorie" className="mt-4">
          <CategoryFields />
        </ActionForm>
      </section>
    </div>
  );
}

function CategoryFields({ c }: { c?: Cat }) {
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom (français)" name="name_fr" defaultValue={c?.name_fr} required />
        <Field label="Nom (wolof)" name="name_wo" defaultValue={c?.name_wo} />
        <Field label="Slug (URL)" name="slug" defaultValue={c?.slug} />
        <Field label="Ordre d'affichage" name="sort_order" defaultValue={c?.sort_order ?? 0} inputMode="numeric" />
        <TextArea label="Description (français)" name="description_fr" defaultValue={c?.description_fr} rows={3} />
        <TextArea label="Description (wolof)" name="description_wo" defaultValue={c?.description_wo} rows={3} />
        <Field label="Titre SEO (français)" name="seo_title_fr" defaultValue={c?.seo_title_fr} />
        <Field label="Titre SEO (wolof)" name="seo_title_wo" defaultValue={c?.seo_title_wo} />
        <TextArea label="Meta description (français)" name="seo_description_fr" defaultValue={c?.seo_description_fr} rows={2} />
        <TextArea label="Meta description (wolof)" name="seo_description_wo" defaultValue={c?.seo_description_wo} rows={2} />
      </div>
      <div className="mt-4 max-w-xs">
        <Checkbox label="Catégorie visible" name="is_active" defaultChecked={c?.is_active ?? true} />
      </div>
    </>
  );
}
