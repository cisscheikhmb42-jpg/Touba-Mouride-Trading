import { notFound } from "next/navigation";

/** Toute URL inconnue sous /fr ou /wo → page 404 localisée. */
export function generateStaticParams() {
  return [{ rest: ["_"] }];
}

export default function CatchAll() {
  notFound();
}
