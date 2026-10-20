import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id, name_fr").order("sort_order");
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/produits" className="link text-sm">
        ← Produits
      </Link>
      <h1 className="text-3xl font-extrabold">Nouveau produit</h1>
      <p className="text-sm text-muted">Les photos et les variantes s&apos;ajoutent après la création du produit.</p>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}
