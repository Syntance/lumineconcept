"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-400">
        Coś poszło nie tak
      </p>
      <h1 className="font-display text-3xl text-brand-800 lg:text-4xl">
        Wystąpił błąd
      </h1>
      <p className="max-w-sm text-sm text-brand-500">
        Przepraszamy za utrudnienia. Spróbuj odświeżyć stronę lub wróć do sklepu.
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-brand-800 px-6 py-2.5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-800 hover:text-white"
        >
          Spróbuj ponownie
        </button>
        <Link
          href="/"
          className="rounded-md bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
        >
          Strona główna
        </Link>
      </div>
    </div>
  );
}
