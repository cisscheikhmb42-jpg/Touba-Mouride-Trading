/** Lecture typée des champs de formulaire. */
export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

export function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true" || fd.get(key) === "1";
}

/** Montant FCFA entier ; vide = null (prix à confirmer). */
export function amount(fd: FormData, key: string): number | null | "invalid" {
  const raw = str(fd, key).replace(/[\s  .]/g, "");
  if (raw === "") return null;
  if (!/^\d{1,12}$/.test(raw)) return "invalid";
  return Number(raw);
}

export function int(fd: FormData, key: string, fallback = 0): number | "invalid" {
  const raw = str(fd, key);
  if (raw === "") return fallback;
  if (!/^-?\d{1,9}$/.test(raw)) return "invalid";
  return Number(raw);
}

export type ActionState = { ok: boolean; message: string } | null;

export function dbError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Cette valeur existe déjà (slug ou référence en double).";
  if (error.code === "23514") return "Valeur refusée par les règles de la boutique (ex. stock négatif, prix barré inférieur au prix, slug invalide).";
  if (error.code === "23503") return "Élément lié introuvable ou encore utilisé.";
  if (error.code === "42501") return "Action non autorisée.";
  if (error.message === "INSUFFICIENT_STOCK") return "Stock insuffisant pour confirmer cette commande.";
  if (error.message === "INVALID_TRANSITION") return "Changement de statut impossible.";
  return `Erreur : ${error.message}`;
}
