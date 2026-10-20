"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { aiDraftDescription } from "@/app/admin/actions";

/** Proposition de description par IA : jamais enregistrée automatiquement. */
export function AiDescriptionHelper({ productId }: { productId: string }) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; text?: string } | null>(null);
  return (
    <div className="space-y-3">
      <label htmlFor="ai-notes" className="field-label">
        Informations réelles sur le produit (matière, usage, détails…)
      </label>
      <textarea id="ai-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} className="field" />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setResult(await aiDraftDescription(productId, notes));
          setBusy(false);
        }}
        className="btn btn-outline"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
        Proposer une description
      </button>
      {result && (
        <div role="status" className="space-y-2">
          <p className={`text-sm font-semibold ${result.ok ? "text-success" : "text-danger"}`}>{result.message}</p>
          {result.text && (
            <>
              <textarea readOnly rows={8} value={result.text} className="field" aria-label="Proposition de description" />
              <button type="button" className="link text-sm" onClick={() => navigator.clipboard.writeText(result.text!)}>
                Copier (puis collez-la dans « Description (français) »)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
