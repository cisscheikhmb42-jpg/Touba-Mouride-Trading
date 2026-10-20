"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Client navigateur (administration : connexion, envoi de fichiers). */
export function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
