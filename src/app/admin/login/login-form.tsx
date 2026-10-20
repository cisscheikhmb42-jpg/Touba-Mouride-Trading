"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(
    params.get("erreur") === "acces" ? "Ce compte n'a pas les droits d'administration." : null,
  );
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="card mt-8 space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const supabase = getBrowserSupabase();
        const { error: err } = await supabase.auth.signInWithPassword({
          email: String(fd.get("email") ?? "").trim(),
          password: String(fd.get("password") ?? ""),
        });
        if (err) {
          setError("E-mail ou mot de passe incorrect.");
          setBusy(false);
          return;
        }
        router.replace("/admin");
        router.refresh();
      }}
    >
      <div>
        <label htmlFor="email" className="field-label">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Mot de passe
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn btn-dark w-full">
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Se connecter
      </button>
    </form>
  );
}
