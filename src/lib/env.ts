/** Variables publiques (exposées au navigateur, sans secret). */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Adresse publique du site (canonical, sitemap, liens partagés).
 * 1. NEXT_PUBLIC_SITE_URL si défini (domaine personnalisé) ;
 * 2. sinon l'adresse de production fournie automatiquement par Vercel ;
 * 3. sinon localhost (développement).
 */
const vercelProduction = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelProduction ? `https://${vercelProduction}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");
