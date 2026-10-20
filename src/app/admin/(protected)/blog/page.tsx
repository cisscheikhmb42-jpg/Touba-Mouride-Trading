import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDateTime } from "@/lib/admin/labels";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  const { supabase } = await requireAdmin();
  const { data: posts, error } = await supabase.from("blog_posts").select("id, title_fr, slug, is_published, updated_at").order("updated_at", { ascending: false });
  if (error) return <p className="text-danger">{error.message}</p>;
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Blog</h1>
        <Link href="/admin/blog/nouveau" className="btn btn-primary">
          <Plus className="size-4" aria-hidden="true" /> Nouvel article
        </Link>
      </div>
      <p className="text-sm text-muted">Publiez des guides utiles et originaux. N&apos;y affirmez que des informations vérifiées.</p>
      {!posts?.length ? (
        <p className="card p-8 text-center text-muted">Aucun article.</p>
      ) : (
        <ul className="card divide-y divide-line">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/blog/${p.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-paper">
                <span className="font-semibold">{p.title_fr}</span>
                <span className="text-xs text-muted">
                  {p.is_published ? "Publié" : "Brouillon"} · {formatDateTime(p.updated_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
