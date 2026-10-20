import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, LayoutDashboard, Newspaper, Package, Settings, ShoppingCart, Tags, Truck } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { signOut } from "../actions";

const NAV = [
  { href: "/admin", label: "Tableau de bord", Icon: LayoutDashboard },
  { href: "/admin/commandes", label: "Commandes", Icon: ShoppingCart },
  { href: "/admin/produits", label: "Produits", Icon: Package },
  { href: "/admin/categories", label: "Catégories", Icon: Tags },
  { href: "/admin/livraison", label: "Livraison", Icon: Truck },
  { href: "/admin/parametres", label: "Paramètres", Icon: Settings },
  { href: "/admin/blog", label: "Blog", Icon: Newspaper },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-ink text-white lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5 lg:py-6">
          <Link href="/admin" className="font-display text-sm leading-tight font-extrabold tracking-wider uppercase">
            Touba Mouride
            <br />
            Trading <span className="text-brand-400">· Admin</span>
          </Link>
        </div>
        <nav aria-label="Administration" className="overflow-x-auto px-2 pb-3 lg:px-3">
          <ul className="flex gap-1 lg:flex-col">
            {NAV.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-white/80 hover:bg-white/10 hover:text-white">
                  <Icon className="size-4" aria-hidden="true" /> {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/fr" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-white/60 hover:text-white">
                <ExternalLink className="size-4" aria-hidden="true" /> Voir le site
              </Link>
            </li>
          </ul>
        </nav>
        <div className="hidden px-5 py-4 lg:block">
          <Suspense>
            <SessionBox />
          </Suspense>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <Suspense fallback={<p className="text-muted">Chargement…</p>}>{children}</Suspense>
        <div className="mt-10 lg:hidden">
          <Suspense>
            <SessionBox />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function SessionBox() {
  const { user } = await requireAdmin();
  return (
    <div className="text-xs text-white/60 lg:text-white/60">
      <p className="truncate text-muted lg:text-white/60">{user.email}</p>
      <form action={signOut}>
        <button type="submit" className="mt-2 font-semibold text-danger underline lg:text-brand-300">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
