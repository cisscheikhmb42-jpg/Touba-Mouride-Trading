import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LOCALES = ["fr", "wo"];
const LOCALE_COOKIE = "tmt_lang";

/**
 * 1. /admin : rafraîchit la session Supabase et redirige vers la page de
 *    connexion si aucune session (contrôle optimiste ; les droits réels
 *    sont vérifiés côté serveur et par les politiques RLS).
 * 2. Pages publiques sans préfixe de langue : redirection vers /fr ou /wo
 *    (langue choisie par le visiteur via le sélecteur, sinon français).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return handleAdmin(request);
  }

  const first = pathname.split("/")[1];
  // La langue est mémorisée par le sélecteur (cookie posé au clic du
  // visiteur) ; le proxy se contente de la lire pour rediriger « / ».
  if (LOCALES.includes(first)) return NextResponse.next();

  const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = preferred && LOCALES.includes(preferred) ? preferred : "fr";
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, pathname === "/" ? 307 : 308);
}

async function handleAdmin(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isLogin = request.nextUrl.pathname === "/admin/login";
  if (!data?.claims && !isLogin) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    return NextResponse.redirect(login);
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques, l'API et les fichiers SEO.
    "/((?!_next/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest|mp4|webm)$).*)",
  ],
};
