"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { ActionState } from "@/lib/admin/form";

type Action = (state: ActionState, fd: FormData) => Promise<ActionState>;

/** Formulaire relié à une Server Action, avec message de résultat accessible. */
export function ActionForm({
  action,
  children,
  submitLabel = "Enregistrer",
  className = "",
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SubmitButton label={submitLabel} />
        <StatusMessage state={state} />
      </div>
    </form>
  );
}

export function SubmitButton({ label, variant = "dark" }: { label: string; variant?: "dark" | "primary" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`btn ${variant === "dark" ? "btn-dark" : "btn-primary"}`}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {label}
    </button>
  );
}

export function StatusMessage({ state }: { state: ActionState }) {
  if (!state) return <span role="status" aria-live="polite" />;
  return (
    <span
      role={state.ok ? "status" : "alert"}
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-sm font-semibold ${state.ok ? "text-success" : "text-danger"}`}
    >
      {state.ok ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <XCircle className="size-4" aria-hidden="true" />}
      {state.message}
    </span>
  );
}

/** Bouton de suppression avec confirmation. */
export function ConfirmSubmit({ label, confirm, className = "" }: { label: string; confirm: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-danger hover:underline disabled:opacity-50 ${className}`}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
      {label}
    </button>
  );
}
