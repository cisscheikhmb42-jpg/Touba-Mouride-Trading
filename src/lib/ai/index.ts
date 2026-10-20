import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Intelligence artificielle (facultative). Appels UNIQUEMENT côté
 * serveur ; la clé ne quitte jamais le serveur. Sans ANTHROPIC_API_KEY,
 * les fonctions IA sont simplement masquées et le site fonctionne.
 */
export const isAiConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

const MODEL = process.env.AI_MODEL || "claude-opus-5-5";
const MAX_PER_HOUR = Number(process.env.AI_MAX_REQUESTS_PER_HOUR || 30);

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}

export type DescriptionInput = {
  name: string;
  category: string | null;
  variants: string[];
  notes: string;
};

const SYSTEM = `Tu rédiges des descriptions de fiches produits pour TOUBA MOURIDE TRADING, boutique sénégalaise d'articles et accessoires de l'univers mouride.
Règles strictes :
- N'utilise QUE les informations fournies. N'invente aucune matière, dimension, origine, prix, délai, promotion, garantie ni caractéristique.
- N'affirme rien sur l'histoire, la religion ou des personnalités : reste factuel et respectueux.
- Ton élégant, clair et chaleureux ; phrases courtes ; pas de bourrage de mots-clés ; pas d'emojis ni de markdown.
- Si les informations sont maigres, écris une description courte et neutre plutôt que d'inventer.
Réponds uniquement avec le texte de la description en français (2 à 4 courts paragraphes au maximum).`;

/** Brouillon de description à relire par l'administrateur. */
export async function draftProductDescription(
  userId: string,
  input: DescriptionInput,
): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  if (!isAiConfigured) return { ok: false, message: "L'assistant IA n'est pas configuré." };
  if (!rateLimit(`ai:${userId}`, MAX_PER_HOUR, 60 * 60_000)) {
    return { ok: false, message: "Limite horaire de l'assistant atteinte. Réessayez plus tard." };
  }
  const facts = [
    `Nom : ${input.name.slice(0, 160)}`,
    input.category ? `Catégorie : ${input.category.slice(0, 120)}` : null,
    input.variants.length ? `Options disponibles : ${input.variants.slice(0, 30).join(", ").slice(0, 600)}` : null,
    input.notes.trim() ? `Informations du propriétaire : ${input.notes.trim().slice(0, 1500)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      // Tâche courte : effort bas pour limiter le coût et la latence.
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: `Rédige la description de ce produit.\n\n${facts}` }],
    });
    if (response.stop_reason === "refusal") {
      return { ok: false, message: "L'assistant n'a pas pu rédiger cette description." };
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!text) return { ok: false, message: "Réponse vide de l'assistant." };
    return { ok: true, text };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { ok: false, message: "Service IA saturé, réessayez dans un instant." };
    if (error instanceof Anthropic.AuthenticationError) return { ok: false, message: "Clé API IA invalide (configuration serveur)." };
    if (error instanceof Anthropic.APIError) {
      console.error("[ai] API", error.status, error.message);
      return { ok: false, message: "Erreur du service IA." };
    }
    console.error("[ai]", (error as Error).message);
    return { ok: false, message: "Service IA injoignable." };
  }
}
