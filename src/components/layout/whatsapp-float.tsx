"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useStore } from "./store-context";

/**
 * Accès WhatsApp permanent. Masqué sur le panier et les fiches produits,
 * qui ont déjà leurs propres boutons WhatsApp (pas de doublon ni de
 * chevauchement avec la barre d'achat mobile).
 */
export function WhatsAppFloat() {
  const { dict } = useI18n();
  const { whatsappNumber } = useStore();
  const pathname = usePathname() ?? "";
  if (/\/(panier|produit)(\/|$)/.test(pathname)) return null;
  return (
    <a
      href={whatsappUrl(whatsappNumber)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={dict.common.whatsappFloat}
      className="fixed right-4 bottom-4 z-30 grid size-14 place-items-center rounded-full bg-brand-700 text-white shadow-[var(--shadow-lift)] transition hover:scale-105 hover:bg-brand-800 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
