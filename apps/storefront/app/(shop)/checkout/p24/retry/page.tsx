"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { retryPrzelewy24Payment } from "@/lib/medusa/checkout";

function P24RetryInner() {
  const params = useSearchParams();
  const cartId = params.get("cart_id");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!cartId) {
      setError("Brak identyfikatora koszyka. Wróć do koszyka i spróbuj ponownie.");
      return;
    }

    (async () => {
      try {
        const url = await retryPrzelewy24Payment(cartId);
        window.location.assign(url);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Nie udało się przygotować płatności. Spróbuj ponownie.",
        );
      }
    })();
  }, [cartId]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-6 font-display text-2xl font-semibold text-brand-800">
          Nie udało się rozpocząć płatności
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-brand-600">{error}</p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/checkout"
            className="rounded-md bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
          >
            Wróć do checkoutu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
      <h1 className="mt-6 font-display text-2xl font-semibold text-brand-800">
        Przekierowujemy do płatności…
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-brand-600">
        Przygotowujemy bezpieczną sesję Przelewy24. Za chwilę przejdziesz do bramki
        płatności.
      </p>
    </div>
  );
}

export default function P24RetryPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
        </div>
      }
    >
      <P24RetryInner />
    </Suspense>
  );
}
