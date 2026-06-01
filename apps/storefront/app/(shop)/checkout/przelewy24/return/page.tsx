"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import {
  completeCart,
  isCartAlreadyCompletedError,
  notifyOrderPlaced,
} from "@/lib/medusa/checkout";

/**
 * Harmonogram odpytań finalizacji. Webhook P24 (urlStatus → /hooks/payment)
 * dociera asynchronicznie — czasem ułamek sekundy po powrocie klienta, czasem
 * kilka sekund. Dopóki płatność nie jest potwierdzona, `completeCart` zwraca
 * koszyk (status pending) zamiast zamówienia, więc ponawiamy.
 */
const POLL_DELAYS_MS = [800, 1200, 1800, 2500, 3000, 3000, 4000, 4000];

type ReturnState =
  | { kind: "verifying" }
  | { kind: "pending" }
  | { kind: "error"; message: string };

function clearLocalCart() {
  try {
    localStorage.removeItem("lumine_cart_id");
    localStorage.removeItem("lumine_express");
    sessionStorage.removeItem("lumine_checkout_draft_v1");
  } catch {
    /* prywatny tryb */
  }
}

function Przelewy24ReturnInner() {
  const params = useSearchParams();
  const cartId = params.get("cart_id");
  const [state, setState] = useState<ReturnState>({ kind: "verifying" });
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!cartId) {
      setState({
        kind: "error",
        message: "Brak identyfikatora koszyka. Sprawdź skrzynkę e-mail lub skontaktuj się z nami.",
      });
      return;
    }

    let cancelled = false;

    (async () => {
      for (let i = 0; i <= POLL_DELAYS_MS.length; i++) {
        if (cancelled) return;
        try {
          const result = await completeCart(cartId, { retries: 0 });
          if (result.type === "order") {
            notifyOrderPlaced(result.order.id);
            clearLocalCart();
            const qs = new URLSearchParams({ order_id: result.order.id });
            if (result.order.display_id) {
              qs.set("display_id", String(result.order.display_id));
            }
            window.location.assign(`/checkout/potwierdzenie?${qs.toString()}`);
            return;
          }
          // type === "cart" → płatność jeszcze niepotwierdzona, ponawiamy.
        } catch (e) {
          if (isCartAlreadyCompletedError(e)) {
            // Zamówienie już powstało (np. po odświeżeniu) — czyścimy i
            // pokazujemy stan sukcesu generyczny.
            clearLocalCart();
            window.location.assign("/checkout/potwierdzenie");
            return;
          }
          // Błąd sieci/serwera — spróbujemy ponownie w kolejnej iteracji.
        }
        if (i < POLL_DELAYS_MS.length) {
          await new Promise((r) => setTimeout(r, POLL_DELAYS_MS[i]));
        }
      }
      if (!cancelled) setState({ kind: "pending" });
    })();

    return () => {
      cancelled = true;
    };
  }, [cartId]);

  if (state.kind === "verifying") {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
        <h1 className="mt-6 font-display text-2xl font-semibold text-brand-800">
          Potwierdzamy płatność…
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-brand-600">
          Trwa weryfikacja transakcji w Przelewy24. Nie zamykaj tego okna — za
          chwilę przeniesiemy Cię do potwierdzenia zamówienia.
        </p>
      </div>
    );
  }

  if (state.kind === "pending") {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-6 font-display text-2xl font-semibold text-brand-800">
          Płatność jest przetwarzana
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-brand-600">
          Jeśli płatność się powiodła, potwierdzenie zamówienia trafi na Twój
          e-mail w ciągu kilku minut. Możesz bezpiecznie zamknąć tę stronę.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/sklep"
            className="rounded-md bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
          >
            Wróć do sklepu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
      <h1 className="mt-6 font-display text-2xl font-semibold text-brand-800">
        Coś poszło nie tak
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-brand-600">{state.message}</p>
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/koszyk"
          className="rounded-md bg-brand-800 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-900 transition-colors"
        >
          Wróć do koszyka
        </Link>
      </div>
    </div>
  );
}

export default function Przelewy24ReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent" />
        </div>
      }
    >
      <Przelewy24ReturnInner />
    </Suspense>
  );
}
