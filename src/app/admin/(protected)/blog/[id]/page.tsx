import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { ActionForm, ConfirmSubmit } from "@/components/admin/action-form";
import { Checkbox, Field, Panel, TextArea } from "@/components/admin/fields";
import { deleteBlogPost, saveBlogPost } from "../../../actions";

export const metadata: Metadata = { title: "Article" };

export function generateStaticParams() {
  return [{ id: "nouveau" }];
}

export default async function AdminBlogPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const isNew = id === "nouveau";
  let post: Record<string, string | boolean | null> | null = null;
  if (!isNew) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    post = data;
  }
  const v = (k: string) => (post?.[k] as string | null | undefined) ?? null;
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/blog" className="link text-sm">
        ← Blog
      </Link>
      <h1 className="text-3xl font-extrabold">{isNew ? "Nouvel article" : v("title_fr")}</h1>
      <ActionForm action={saveBlogPost} submitLabel={isNew ? "Créer l'article" : "Enregistrer"} className="space-y-6">
        {!isNew && <input type="hidden" name="id" value={id} />}
        {!isNew && <input type="hidden" name="published_at" value={v("published_at") ?? ""} />}
        <Panel title="Contenu">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titre (français)" name="title_fr" defaultValue={v("title_fr")} required />
            <Field label="Titre (wolof)" name="title_wo" defaultValue={v("title_wo")} />
            <Field label="Slug (URL)" name="slug" defaultValue={v("slug")} />
            <Field label="Image de couverture (URL)" name="cover_image_url" defaultValue={v("cover_image_url")} type="url" />
            <TextArea label="Résumé (français)" name="excerpt_fr" defaultValue={v("excerpt_fr")} rows={2} />
            <TextArea label="Résumé (wolof)" name="excerpt_wo" defaultValue={v("excerpt_wo")} rows={2} />
          </div>
          <div className="mt-4 space-y-4">
            <TextArea label="Texte (français)" name="content_fr" defaultValue={v("content_fr")} rows={14} help="Texte simple ; les retours à la ligne sont conservés." />
            <TextArea label="Texte (wolof)" name="content_wo" defaultValue={v("content_wo")} rows={8} />
            <Checkbox label="Publier l'article" name="is_published" defaultChecked={!!post?.is_published} />
          </div>
        </Panel>
      </ActionForm>
      {!isNew && (
        <form action={deleteBlogPost}>
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmit label="Supprimer l'article" confirm="Supprimer définitivement cet article ?" />
        </form>
      )}
    </div>
  );
}
