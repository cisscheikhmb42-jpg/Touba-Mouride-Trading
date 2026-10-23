"use client";

import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/config";
import { whatsappUrl } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/env";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useStore } from "@/components/layout/store-context";

/** Ouvre WhatsApp avec une demande de prix contenant le nom du produit. */
export function AskPriceButton({
  name,
  slug,
  variant = "button",
}: {
  name: string;
  slug: string;
  variant?: "button" | "link";
}) {
  const { locale, dict } = useI18n();
  const { whatsappNumber } = useStore();
  const path = `/${locale}/produit/${slug}`;
  const url = `${SITE_URL}${path}`; // identique serveur/client (pas d'écart d'hydratation)
  const href = whatsappUrl(whatsappNumber, format(dict.product.whatsappPriceMessage, { name, url }));
  if (variant === "link") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline"
      >
        <WhatsAppIcon className="size-3.5" /> {dict.product.askPrice}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
      <WhatsAppIcon /> {dict.product.askPrice}
    </a>
  );
}
