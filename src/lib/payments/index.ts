import "server-only";

/**
 * Architecture de paiement en ligne — AUCUN PRESTATAIRE N'EST CONFIGURÉ.
 *
 * Le parcours actuel est la demande de commande sur WhatsApp : le
 * paiement est organisé directement avec la boutique. Aucun bouton de
 * paiement n'est affiché et aucune transaction n'est simulée.
 *
 * Pour ajouter un prestataire (choisi, contractualisé et testé par la
 * boutique), voir docs/PAIEMENT.md :
 * 1. implémenter PaymentProvider dans un fichier dédié (ex. ./provider-x.ts) ;
 * 2. lire ses identifiants depuis des variables d'environnement SERVEUR
 *    (jamais NEXT_PUBLIC_) ;
 * 3. valider chaque paiement côté serveur par le webhook signé du
 *    prestataire avant de modifier une commande ;
 * 4. retourner l'instance dans getPaymentProvider().
 */
export type PaymentSession = {
  /** URL de la page de paiement hébergée par le prestataire. */
  redirectUrl: string;
  /** Référence du paiement chez le prestataire. */
  providerReference: string;
};

export interface PaymentProvider {
  readonly id: string;
  /** Crée une session de paiement pour une commande déjà enregistrée. */
  createSession(input: { orderId: string; orderNumber: string; amountXof: number }): Promise<PaymentSession>;
  /** Vérifie la signature et le contenu d'une notification (webhook). */
  verifyWebhook(request: Request): Promise<{ orderNumber: string; status: "paid" | "failed" | "pending" }>;
}

/** Aucun prestataire actif : le paiement en ligne est désactivé. */
export function getPaymentProvider(): PaymentProvider | null {
  return null;
}

export const isOnlinePaymentEnabled = false;
