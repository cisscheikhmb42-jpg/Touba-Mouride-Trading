/**
 * Montants en FCFA (XOF) : entiers, séparateur de milliers espace.
 * Ex. 15000 → « 15 000 FCFA ». `plain` utilise une espace simple
 * (message WhatsApp), sinon une espace insécable (affichage).
 */
export function formatFCFA(amount: number, { plain = false }: { plain?: boolean } = {}): string {
  const sep = plain ? " " : " ";
  const digits = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return `${digits}${sep}FCFA`;
}

export function formatDate(iso: string, locale: "fr" | "wo"): string {
  return new Intl.DateTimeFormat(locale === "wo" ? "fr-SN" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
