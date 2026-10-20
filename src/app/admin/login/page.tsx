import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-sm font-extrabold tracking-[0.12em] uppercase">Touba Mouride Trading</p>
        <h1 className="mt-2 text-center text-2xl font-extrabold">Espace administrateur</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
