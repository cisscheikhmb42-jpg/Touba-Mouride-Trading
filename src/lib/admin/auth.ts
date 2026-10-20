import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Vérifie côté serveur que l'utilisateur est connecté ET inscrit dans
 * public.admin_users. Être connecté ne suffit pas. Les politiques RLS
 * appliquent de toute façon la même règle à chaque requête.
 */
export async function getAdmin() {
  await connection(); // toujours évalué à la requête, jamais prérendu
  const supabase = await getServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data: row } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!row) return { supabase, user, isAdmin: false as const };
  return { supabase, user, isAdmin: true as const };
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (!admin.isAdmin) redirect("/admin/login?erreur=acces");
  return admin;
}
