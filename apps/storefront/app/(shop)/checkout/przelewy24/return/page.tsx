"use client";

import { Suspense, useEffect, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, XCircle } from "lucide-react";
import {
  completeCart,
  fetchP24ReturnStatus,
  buildP24RetryUrl,
  isCartAlreadyCompletedError,
  markCheckoutCompleted,
  notifyOrderPlaced,
  notifyPaymentFailed,
  attachOrderNotes,
  redirectToOrderConfirmation,
  retryPrzelewy24Payment,
} from "@/lib/medusa/checkout";

const CHECKOUT_DRAFT_STORAGE_KEY = "lumine_checkout_draft_v1";

/** Krótkie okno na potwierdzenie z P24 zanim pokażemy „nieudana”. */
const FAILED_GRACE_MS = 2_000;

/** Tylko przy statusie 1 (verify) — płatność realnie w toku. */
function isPaymentInProgress(
  status: Awaited<ReturnType<typeof fetchP24ReturnStatus>>,
): boolean {
  return status?.status === "pending" && status.p24_status === 1;
}

function showFailedState(
  retryUrl: string,
  cartId: string,
  emailSentRef: MutableRefObject<boolean>,
) {
  if (!emailSentRef.current) {
    emailSentRef.current = true;
    notifyPaymentFailed(cartId, retryUrl);
  }
  return { kind: "failed" as const, retryUrl };
}

const POLL_DELAYS_MS = [800, 1200, 1800, 2500, 3000, 3000, 4000, 4000];

type ReturnState =
  | { kind: "verifying" }
  | { kind: "pending" }
  | { kind: "failed"; retryUrl: string }
  | { kind: "error"; message: string };

function readCheckoutDraftOrderNotes(): string {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { formData?: { orderNotes?: string } };
    return typeof parsed.formData?.orderNotes === "string"
      ? parsed.formData.orderNotes.trim()
      : "";
  } catch {
    return "";
  }
}

function clearLocalCart() {
  try {
    localStorage.removeItem("lumine_cart_id");
    localStorage.removeItem("lumine_express");
    sessionStorage.removeItem("lumine_checkout_draft_v1");
  } catch {
    /* prywatny tryb */
  }
}

function FailedActions({
  cartId,
  retryUrl,
}: {
  cartId: string;
  retryUrl: string;
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      const url = await retryPrzelewy24Payment(cartId);
      window.location.assign(url);
    } catch (e) {
      setRetryError(
        e instanceof Error
          ? e.message
          : "Nie udało się przygotować płatności. Spróbuj ponownie.",
      );
      setRetrying(false);
    }
  };

  return (
    <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-4 text-center">
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="w-full rounded-md bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-60 sm:w-auto"
      >
        {retrying ? "Przekierowujemy…" : "Zapłać ponownie"}
      </button>
      <Link
        href="/sklep"
        className="text-sm text-brand-600 underline hover:text-brand-800"
      >
        Wróć do sklepu
      </Link>
      {retryError ? (
        <p className="text-sm text-red-600">{retryError}</p>
      ) : null}
      <p className="text-xs text-brand-400">
        Możesz też użyć linku z e-maila:{" "}
        <a href={retryUrl} className="underline hover:text-brand-600">
          ponów płatność
        </a>
      </p>
    </div>
  );
}

function Przelewy24ReturnInner() {
  const params = useSearchParams();
  const cartId = params.get("cart_id");
  const [state, setState] = useState<ReturnState>({ kind: "verifying" });
  const startedRef = useRef(false);
  const emailSentRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!cartId) {
      setState({
        kind: "error",
        message:
          "Brak identyfikatora koszyka. Sprawdź skrzynkę e-mail lub skontaktuj się z nami.",
      });
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    let lastRetryUrl = buildP24RetryUrl(cartId);

    (async () => {
      for (let i = 0; i <= POLL_DELAYS_MS.length; i++) {
        if (cancelled) return;

        const allowFailedOnZero = Date.now() - startedAt >= FAILED_GRACE_MS;

        const [p24Status, completeResult] = await Promise.all([
          fetchP24ReturnStatus(cartId, { allowFailedOnZero }).catch(() => null),
          completeCart(cartId, { retries: 0 }).catch((e) => {
            if (isCartAlreadyCompletedError(e)) return "completed" as const;
            return null;
          }),
        ]);

        if (completeResult === "completed") {
          clearLocalCart();
          if (typeof window !== "undefined") {
            window.location.replace("/checkout/potwierdzenie");
          }
          return;
        }

        if (
          completeResult &&
          typeof completeResult === "object" &&
          completeResult.type === "order"
        ) {
          const orderNotes = readCheckoutDraftOrderNotes();
          if (orderNotes) {
            attachOrderNotes(completeResult.order.id, orderNotes);
          }
          notifyOrderPlaced(completeResult.order.id);
          markCheckoutCompleted(
            completeResult.order.id,
            completeResult.order.display_id ?? undefined,
          );
          clearLocalCart();
          redirectToOrderConfirmation(
            completeResult.order.id,
            completeResult.order.display_id ?? undefined,
          );
          return;
        }

        if (p24Status?.retry_url) {
          lastRetryUrl = p24Status.retry_url;
        }

        if (allowFailedOnZero && p24Status?.status === "failed") {
          setState(showFailedState(lastRetryUrl, cartId, emailSentRef));
          return;
        }

        if (i < POLL_DELAYS_MS.length) {
          await new Promise((r) => setTimeout(r, POLL_DELAYS_MS[i]));
        }
      }

      if (!cancelled) {
        const finalStatus = await fetchP24ReturnStatus(cartId, {
          allowFailedOnZero: true,
        }).catch(() => null);
        if (finalStatus?.retry_url) lastRetryUrl = finalStatus.retry_url;
        else lastRetryUrl = buildP24RetryUrl(cartId);

        if (isPaymentInProgress(finalStatus)) {
          setState({ kind: "pending" });
        } else if (finalStatus?.status === "paid") {
          try {
            const result = await completeCart(cartId, { retries: 0 });
            if (result.type === "order") {
              const orderNotes = readCheckoutDraftOrderNotes();
              if (orderNotes) {
                attachOrderNotes(result.order.id, orderNotes);
              }
              notifyOrderPlaced(result.order.id);
              markCheckoutCompleted(
                result.order.id,
                result.order.display_id ?? undefined,
              );
              clearLocalCart();
              redirectToOrderConfirmation(
                result.order.id,
                result.order.display_id ?? undefined,
              );
              return;
            }
          } catch {
            /* fallback pending poniżej */
          }
          setState({ kind: "pending" });
        } else {
          setState(showFailedState(lastRetryUrl, cartId, emailSentRef));
        }
      }
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
          Trwa weryfikacja transakcji w Przelewy24 — zwykle kilka sekund. Za
          chwilę przeniesiemy Cię do potwierdzenia zamówienia.
        </p>
      </div>
    );
  }

  if (state.kind === "failed") {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-6 font-display text-2xl font-semibold text-brand-800">
          Płatność nie powiodła się
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-brand-600">
          Transakcja w Przelewy24 nie została zrealizowana. Twoje produkty
          nadal czekają w koszyku — możesz spróbować ponownie. Wysłaliśmy też
          e-mail z linkiem do płatności.
        </p>
        <FailedActions cartId={cartId!} retryUrl={state.retryUrl} />
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
          Czekamy na potwierdzenie z Przelewy24. Możesz bezpiecznie zamknąć tę
          stronę — gdy wpłata zostanie zaksięgowana, zamówienie utworzy się
          automatycznie, a potwierdzenie z numerem zamówienia trafi na Twój
          e-mail.
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
