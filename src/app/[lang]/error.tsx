"use client";

import { useI18n } from "@/i18n/client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dict } = useI18n();
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="text-3xl font-extrabold">{dict.error.title}</h1>
      <p className="mt-3 max-w-md text-muted">{dict.error.text}</p>
      <button type="button" onClick={reset} className="btn btn-dark mt-8">
        {dict.error.retry}
      </button>
    </div>
  );
}
