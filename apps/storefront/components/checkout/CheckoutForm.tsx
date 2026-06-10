"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "@lumine/types";
import { ShippingSelector } from "./ShippingSelector";
import { PaymentSelector } from "./PaymentSelector";
import { OrderSummary } from "./OrderSummary";
import {
  trackCheckoutAbandon,
  trackCheckoutStart,
  trackCheckoutStep,
  trackFormStart,
  trackFormSubmit,
  trackPurchase,
} from "@/lib/analytics/events";
import { identifyLead, markPurchaseCustomer } from "@/lib/analytics/identify";
import { useCart } from "@/hooks/useCart";
import {
  completeCart,
  describeMedusaError,
  initPaymentSession,
  initPrzelewy24Redirect,
  isCartAlreadyCompletedError,
  markCheckoutCompleted,
  notifyBankTransferPending,
  notifyOrderPlaced,
  prefetchPaymentReadiness,
  prefetchShippingOptions,
  prepareCheckout,
  PRZELEWY24_PROVIDER_ID,
  readCheckoutCompleted,
  clearCheckoutCompleted,
  redirectToOrderConfirmation,
  assertCartReadyForCheckout,
  saveContactDetails,
  SYSTEM_PAYMENT_PROVIDER_ID,
} from "@/lib/medusa/checkout";
import { getBankTransferDetails } from "@/lib/payment/bank-transfer";
import { getPolishRegionId } from "@/lib/medusa/region";

type CheckoutStep = 1 | 2 | 3;

const CHECKOUT_DRAFT_STORAGE_KEY = "lumine_checkout_draft_v1";

type CheckoutFormData = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  shippingOptionId: string;
  paymentProviderId: string;
  newsletter: boolean;
  wantInvoice: boolean;
  companyName: string;
  nip: string;
  acceptTerms: boolean;
  acceptRodo: boolean;
};

type CheckoutDraftPayload = {
  v: 1;
  cartId: string;
  step: CheckoutStep;
  formData: CheckoutFormData;
};

function getDefaultCheckoutFormData(): CheckoutFormData {
  return {
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    shippingOptionId: "",
    paymentProviderId: "",
    newsletter: false,
    wantInvoice: false,
    companyName: "",
    nip: "",
    acceptTerms: false,
    acceptRodo: false,
  };
}

function clampCheckoutStep(n: unknown): CheckoutStep {
  const s = typeof n === "number" ? n : Number(n);
  if (s === 2 || s === 3) return s;
  return 1;
}

function clearCheckoutDraft(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
  } catch {
    /* prywatny tryb */
  }
}

const STEPS = [
  { number: 1, label: "Dane" },
  { number: 2, label: "Dostawa" },
  { number: 3, label: "Płatność" },
] as const;

const INPUT_CLASS =
  "w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";
const LABEL_CLASS = "block text-sm font-medium text-brand-700 mb-1";

/**
 * Gdy Medusa oznajmia, że koszyk jest już completed, zużyty cart_id nadal
 * siedzi w localStorage — bez twardego resetu każdy kolejny klik dostaje
 * ten sam błąd. Czyścimy lokalny stan i przeładowujemy stronę.
 */
function resetStaleCartAndReload() {
  clearCheckoutDraft();
  try {
    localStorage.removeItem("lumine_cart_id");
    localStorage.removeItem("lumine_express");
  } catch {
    /* prywatny tryb */
  }
  if (typeof window !== "undefined") {
    window.location.assign("/koszyk");
  }
}

export function CheckoutForm() {
  const { id: cartId, items, total, refreshCart, isInitialized } = useCart();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [formStarted, setFormStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /**
   * Po ~3s od kliknięcia „Zamawiam i płacę" pokazujemy dodatkowy komunikat
   * „Przetwarzamy zamówienie…". Typowy `completeCart` kończy się w <1s, ale
   * cold start Railway potrafi wydłużyć to do 5–8s i bez tego user widzi
   * goły spinner, co pogarsza konwersję.
   */
  const [submitSlow, setSubmitSlow] = useState(false);
  const submitSlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staleResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beginCheckoutFiredRef = useRef(false);

  /**
   * Po udanym zamówieniu — nie wracaj na checkout (przycisk Wstecz). Aktywny
   * koszyk = nowe zamówienie. KLUCZOWE: czekamy aż koszyk się zbootstrapuje
   * (`isInitialized`), bo na pierwszym renderze `cartId` jest null i `items`
   * puste — bez tej bramki stara flaga „completed" cofała usera na potwierdzenie
   * mimo że dodał nowy produkt.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isInitialized) return;
    if (cartId && items.length > 0) {
      clearCheckoutCompleted();
      return;
    }
    const completed = readCheckoutCompleted();
    if (completed) {
      redirectToOrderConfirmation(completed.orderId, completed.displayId);
    }
  }, [cartId, items.length, isInitialized]);

  /** Pusty koszyk nie może iść do płatności — wróć do koszyka (po bootstrapie). */
  useEffect(() => {
    if (!isInitialized) return;
    if (!cartId || items.length > 0) return;
    if (typeof window === "undefined") return;
    if (readCheckoutCompleted()) return;
    window.location.replace("/koszyk");
  }, [cartId, items.length, isInitialized]);

  useEffect(() => {
    return () => {
      if (staleResetTimerRef.current) {
        clearTimeout(staleResetTimerRef.current);
        staleResetTimerRef.current = null;
      }
    };
  }, []);

  /**
   * Prefetch opcji dostawy + „gotowości płatności" w tle — Step 2 i Step 3
   * mają dane natychmiast, zamiast czekać na kolejne round-tripy po
   * kliknięciu odpowiednich CTA. Cache jest moduł-level (checkout.ts),
   * więc wielokrotne mountowania komponentu nie dublują żądań.
   *
   * Ogólnie oszczędzamy przy Step 1→2 ~3,4 s (shipping-options) i przy
   * Step 2→3 ~1,5 s (region + payment-providers). Wszystko dzieje się
   * równolegle z wypełnianiem formularza kontaktowego.
   */
  useEffect(() => {
    if (!cartId) return;
    void prefetchShippingOptions(cartId).catch(() => {
      /* błąd dopiero w Step 2 — tam jest UI do pokazania */
    });
    void prefetchPaymentReadiness(getPolishRegionId)
      .then((r) => setAvailableProviderIds(r.providerIds))
      .catch(() => {
        /* błąd dopiero w Step 3 — tam jest UI do pokazania */
      });
  }, [cartId]);

  /**
   * Meta Pixel / PostHog: odpalamy `begin_checkout` raz, zaraz po tym jak
   * pojawią się itemy w koszyku. Wysyłamy to tu (a nie w `AddToCartButton`),
   * bo ludzie wchodzą na /checkout również z poziomu mini-koszyka.
   */
  useEffect(() => {
    if (beginCheckoutFiredRef.current) return;
    if (!cartId || items.length === 0) return;
    beginCheckoutFiredRef.current = true;
    trackCheckoutStart({
      total,
      currency: "PLN",
      items: items.map((i) => ({
        id: i.variant_id,
        title: i.title,
        price: i.unit_price,
        quantity: i.quantity,
      })),
    });
  }, [cartId, items, total]);

  // Notion: `checkout_abandon` — refy zadeklarujemy tu (potrzebne wyżej w kodzie),
  // a właściwy nasłuch beforeunload montujemy poniżej, gdy `formData` już istnieje.
  const purchaseSentRef = useRef(false);
  const lastStepRef = useRef<CheckoutStep>(1);
  const abandonSnapshotRef = useRef<{ cartValue: number; hasEmail: boolean }>({
    cartValue: 0,
    hasEmail: false,
  });
  useEffect(() => {
    lastStepRef.current = step;
  }, [step]);

  const scheduleStaleReset = useCallback(() => {
    if (staleResetTimerRef.current) {
      clearTimeout(staleResetTimerRef.current);
    }
    staleResetTimerRef.current = setTimeout(resetStaleCartAndReload, 800);
  }, []);
  const [preparingDelivery, setPreparingDelivery] = useState(false);
  const [contactSaveError, setContactSaveError] = useState<string | null>(null);
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [shippingSaveError, setShippingSaveError] = useState<string | null>(null);
  const [availableProviderIds, setAvailableProviderIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<CheckoutFormData>(() =>
    getDefaultCheckoutFormData(),
  );
  /** Aktualny formularz w submit — unika stale closure (np. P24 mimo wyboru przelewu). */
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Snapshot do `checkout_abandon` (Notion) — nie chcemy rejestrować nowego
  // listenera na każdy keystroke, więc trzymamy w refie.
  useEffect(() => {
    abandonSnapshotRef.current = {
      cartValue: total,
      hasEmail: formData.email.includes("@"),
    };
  }, [total, formData.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUnload = () => {
      if (purchaseSentRef.current) return;
      if (!cartId || items.length === 0) return;
      trackCheckoutAbandon({
        lastStep: lastStepRef.current,
        cartValue: abandonSnapshotRef.current.cartValue,
        hasEmail: abandonSnapshotRef.current.hasEmail,
      });
    };
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [cartId, items.length]);

  /** Blokuje jeden zapis do sessionStorage tuż po wczytaniu szkicu (unikamy nadpisania pustym stanem). */
  const skipPersistDraftRef = useRef(false);

  /**
   * Po odświeżeniu / powrocie na /checkout — przywróć krok i pola z szkicu
   * powiązanego z aktualnym `cart_id` (inny koszyk = ignorujemy stary szkic).
   */
  useEffect(() => {
    if (!cartId) return;
    skipPersistDraftRef.current = true;
    try {
      const raw = sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);
      if (!raw) {
        queueMicrotask(() => {
          skipPersistDraftRef.current = false;
        });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<CheckoutDraftPayload>;
      if (parsed.v !== 1 || !parsed.formData || typeof parsed.formData !== "object") {
        queueMicrotask(() => {
          skipPersistDraftRef.current = false;
        });
        return;
      }
      if (parsed.cartId !== cartId) {
        try {
          sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
        } catch {
          /* */
        }
        setStep(1);
        setFormData(getDefaultCheckoutFormData());
        queueMicrotask(() => {
          skipPersistDraftRef.current = false;
        });
        return;
      }
      setStep(clampCheckoutStep(parsed.step));
      setFormData({
        ...getDefaultCheckoutFormData(),
        ...parsed.formData,
      });
    } catch {
      /* uszkodzony JSON */
    }
    queueMicrotask(() => {
      skipPersistDraftRef.current = false;
    });
  }, [cartId]);

  useEffect(() => {
    if (!cartId || skipPersistDraftRef.current) return;
    try {
      const payload: CheckoutDraftPayload = {
        v: 1,
        cartId,
        step,
        formData,
      };
      sessionStorage.setItem(
        CHECKOUT_DRAFT_STORAGE_KEY,
        JSON.stringify(payload),
      );
    } catch {
      /* prywatny tryb / quota */
    }
  }, [cartId, step, formData]);

  const updateField = useCallback(
    <K extends keyof CheckoutFormData>(field: K, value: CheckoutFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleFocus = useCallback(() => {
    if (!formStarted) {
      setFormStarted(true);
      trackFormStart("checkout_contact");
    }
  }, [formStarted]);

  /**
   * Identyfikujemy użytkownika dopiero przy `onBlur` z poprawnym emailem,
   * żeby nie strzelać `identify()` na każdą literę. Notion: "Checkout (krok 1: email):
   * `posthog.identify(email)` po blur na polu email".
   */
  const handleEmailBlur = useCallback(() => {
    if (formData.email.includes("@")) {
      identifyLead({ email: formData.email, source: "checkout" });
    }
  }, [formData.email]);

  const isNipValid = /^\d{10}$/.test(formData.nip.replace(/[-\s]/g, ""));
  const vatValid =
    !formData.wantInvoice ||
    (formData.companyName.trim() !== "" && isNipValid);

  const canGoToStep2 =
    formData.email.includes("@") &&
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.address.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.postalCode.trim() !== "" &&
    vatValid;

  const canGoToStep3 = formData.shippingOptionId !== "";

  const canSubmit =
    formData.paymentProviderId !== "" &&
    formData.acceptTerms &&
    formData.acceptRodo &&
    !!cartId &&
    items.length > 0 &&
    formData.shippingOptionId !== "" &&
    !submitting;

  const handleSubmit = useCallback(async () => {
    if (!cartId) return;
    if (items.length === 0) {
      setSubmitError("Koszyk jest pusty — dodaj produkty i spróbuj ponownie.");
      return;
    }
    if (!formDataRef.current.shippingOptionId) {
      setSubmitError("Wybierz sposób dostawy przed płatnością.");
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    setSubmitting(true);
    setSubmitSlow(false);
    submitSlowTimerRef.current = setTimeout(() => setSubmitSlow(true), 3000);
    trackFormSubmit({ formName: "checkout_payment" });

    const payment = formDataRef.current;

    try {
      await assertCartReadyForCheckout(cartId);

      // Przelewy24 = płatność z przekierowaniem. Inicjujemy sesję P24,
      // a finalizację koszyka (utworzenie zamówienia) robi strona powrotu
      // /checkout/przelewy24/return po potwierdzeniu płatności przez webhook.
      if (payment.paymentProviderId === PRZELEWY24_PROVIDER_ID) {
        await prepareCheckout(
          cartId,
          payment.shippingOptionId,
          payment.paymentProviderId,
        );
        const redirectUrl = await initPrzelewy24Redirect(cartId);
        trackCheckoutStep({ stepNumber: 3, cartValue: total });
        if (typeof window !== "undefined") {
          window.location.assign(redirectUrl);
          return;
        }
      }

      // Przelew tradycyjny — ponownie prepare (dostawa + sesja wybranego providera),
      // bo w kroku 2 sesja mogła powstać dla innego providera (np. P24).
      await prepareCheckout(
        cartId,
        payment.shippingOptionId,
        payment.paymentProviderId,
      );
      await initPaymentSession(cartId, payment.paymentProviderId);

      const result = await completeCart(cartId);

      if (result.type !== "order") {
        const err = (result as { error?: { message?: string; code?: string; type?: string } })
          .error;
        console.error("[checkout] complete zwrócił cart zamiast order", err, result);
        const msg = describeMedusaError(
          err,
          "Nie udało się utworzyć zamówienia (koszyk nie przeszedł w zamówienie).",
        );
        throw new Error(msg);
      }

      trackCheckoutStep({ stepNumber: 3, cartValue: total });
      trackPurchase({
        id: result.order.id,
        total,
        currency: "PLN",
        items: items.map((i) => ({
          id: i.variant_id,
          title: i.title,
          price: i.unit_price,
          quantity: i.quantity,
        })),
        paymentMethod: payment.paymentProviderId,
        shippingMethod: payment.shippingOptionId,
      });
      // Notion: po `purchase` aktualizujemy profil PostHog (`firstOrderId`, `totalSpent`).
      markPurchaseCustomer({
        email: payment.email,
        orderId: result.order.id,
        value: total,
      });
      purchaseSentRef.current = true;

      const isBankTransfer = payment.paymentProviderId === SYSTEM_PAYMENT_PROVIDER_ID;

      if (isBankTransfer) {
        notifyBankTransferPending(result.order.id);
      } else {
        notifyOrderPlaced(result.order.id);
      }

      markCheckoutCompleted(
        result.order.id,
        result.order.display_id ?? undefined,
      );

      try {
        localStorage.removeItem("lumine_cart_id");
        localStorage.removeItem("lumine_express");
      } catch {
        /* prywatny tryb */
      }
      clearCheckoutDraft();
      await refreshCart().catch(() => undefined);

      if (typeof window !== "undefined") {
        redirectToOrderConfirmation(
          result.order.id,
          result.order.display_id ?? undefined,
          isBankTransfer ? { payment: "bank_transfer" } : undefined,
        );
        return;
      }
    } catch (e) {
      console.error("[checkout] błąd składania zamówienia", e);
      if (isCartAlreadyCompletedError(e)) {
        setSubmitError(
          "Koszyk został już sfinalizowany wcześniej. Zaraz zaczniesz od nowa…",
        );
        scheduleStaleReset();
        return;
      }
      const message = describeMedusaError(
        e,
        "Nie udało się złożyć zamówienia. Spróbuj ponownie.",
      );
      setSubmitError(message);
    } finally {
      // Bez tego, gdy nawigacja hard się nie udała (rzadko), przycisk
      // zostaje zablokowany na zawsze.
      setSubmitting(false);
      setSubmitSlow(false);
      if (submitSlowTimerRef.current) {
        clearTimeout(submitSlowTimerRef.current);
        submitSlowTimerRef.current = null;
      }
      submittingRef.current = false;
    }
  }, [cartId, items, total, refreshCart]);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        {/* Step indicator */}
        <nav aria-label="Postęp zamówienia" className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center">
              {i > 0 && (
                <div
                  className={`mx-2 h-px w-8 sm:w-12 transition-colors ${
                    step >= s.number ? "bg-brand-800" : "bg-brand-200"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (s.number < step) setStep(s.number as CheckoutStep);
                }}
                disabled={s.number > step}
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  step === s.number
                    ? "bg-brand-800 text-white shadow-sm"
                    : step > s.number
                      ? "bg-accent/20 text-brand-800 cursor-pointer hover:bg-accent/30"
                      : "bg-brand-100 text-brand-400"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    step === s.number
                      ? "bg-white/20 text-white"
                      : step > s.number
                        ? "bg-brand-800 text-white"
                        : "bg-white text-brand-500"
                  }`}
                >
                  {step > s.number ? "✓" : s.number}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            </div>
          ))}
        </nav>

        {/* Step 1 — Contact info */}
        {step === 1 && (
          <section className="space-y-6">
            <h2 className="font-display text-xl font-semibold text-brand-800">
              Dane kontaktowe
            </h2>

            {/* Email first */}
            <div>
              <label htmlFor="email" className={LABEL_CLASS}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={formData.email}
                onFocus={handleFocus}
                onBlur={handleEmailBlur}
                onChange={(e) => updateField("email", e.target.value)}
                className={INPUT_CLASS}
                placeholder="twoj@email.pl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={LABEL_CLASS}>
                  Imię <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="lastName" className={LABEL_CLASS}>
                  Nazwisko <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="phone" className={LABEL_CLASS}>
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="+48 000 000 000"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className={LABEL_CLASS}>
                  Kod pocztowy <span className="text-red-500">*</span>
                </label>
                <input
                  id="postalCode"
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="00-000"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className={LABEL_CLASS}>
                  Adres <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="ul. Przykładowa 1/2"
                />
              </div>
              <div>
                <label htmlFor="city" className={LABEL_CLASS}>
                  Miasto <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* VAT Invoice */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.wantInvoice}
                  onChange={(e) => updateField("wantInvoice", e.target.checked)}
                  className="h-4 w-4 rounded border-brand-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-brand-700">Chcę fakturę VAT</span>
              </label>

              {formData.wantInvoice && (
                <div className="grid gap-4 sm:grid-cols-2 pl-6">
                  <div>
                    <label htmlFor="companyName" className={LABEL_CLASS}>
                      Nazwa firmy <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      className={`${INPUT_CLASS} ${formData.companyName.trim() === "" && formData.wantInvoice ? "border-red-300" : ""}`}
                    />
                    {formData.companyName.trim() === "" && (
                      <p className="mt-1 text-xs text-red-500">Pole wymagane</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="nip" className={LABEL_CLASS}>
                      NIP <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nip"
                      type="text"
                      required
                      value={formData.nip}
                      onChange={(e) => updateField("nip", e.target.value)}
                      className={`${INPUT_CLASS} ${formData.nip.length > 0 && !isNipValid ? "border-red-300" : ""}`}
                      placeholder="0000000000"
                      maxLength={13}
                    />
                    {formData.nip.length > 0 && !isNipValid && (
                      <p className="mt-1 text-xs text-red-500">NIP musi zawierać 10 cyfr</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Newsletter opt-in */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.newsletter}
                onChange={(e) => updateField("newsletter", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-300 text-accent focus:ring-accent"
              />
              <span className="text-sm text-brand-600">
                Chcę otrzymywać inspiracje, nowości i oferty specjalne na email
              </span>
            </label>

            {contactSaveError && (
              <p className="text-sm text-red-600" role="alert">
                {contactSaveError}
              </p>
            )}

            <button
              type="button"
              onClick={async () => {
                if (!cartId) {
                  setContactSaveError("Brak koszyka — odśwież stronę i spróbuj ponownie.");
                  return;
                }
                setContactSaveError(null);
                setPreparingDelivery(true);
                try {
                  const address: Address = {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                    address_1: formData.address,
                    city: formData.city,
                    postal_code: formData.postalCode,
                    country_code: "pl",
                    ...(formData.wantInvoice && formData.companyName
                      ? { company: formData.companyName }
                      : {}),
                  };
                  trackFormSubmit({ formName: "checkout_contact" });
                  trackCheckoutStep({ stepNumber: 1, cartValue: total });
                  if (formData.email.includes("@")) {
                    identifyLead({
                      email: formData.email,
                      name: `${formData.firstName} ${formData.lastName}`.trim(),
                      source: "checkout",
                    });
                  }
                  await saveContactDetails(cartId, formData.email, address);
                  setStep(2);
                } catch (e) {
                  console.error("[checkout] zapis przed dostawą", e);
                  if (isCartAlreadyCompletedError(e)) {
                    setContactSaveError(
                      "Ten koszyk został już sfinalizowany. Za chwilę zaczniesz od nowa…",
                    );
                    scheduleStaleReset();
                    return;
                  }
                  const message = describeMedusaError(
                    e,
                    "Nie udało się zapisać danych. Sprawdź połączenie i spróbuj ponownie.",
                  );
                  setContactSaveError(message);
                } finally {
                  setPreparingDelivery(false);
                }
              }}
              disabled={!canGoToStep2 || !cartId || preparingDelivery}
              className="w-full rounded-md bg-brand-800 py-3 text-sm font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:bg-brand-200 disabled:text-brand-500 transition-colors"
            >
              {preparingDelivery ? "Zapisywanie…" : "Przejdź do dostawy"}
            </button>
          </section>
        )}

        {/* Step 2 — Shipping */}
        {step === 2 && (
          <section className="space-y-6">
            <h2 className="font-display text-xl font-semibold text-brand-800">
              Sposób dostawy
            </h2>
            <ShippingSelector
              selectedOptionId={formData.shippingOptionId}
              onSelect={(id: string) => updateField("shippingOptionId", id)}
            />
            {shippingSaveError && (
              <p className="text-sm text-red-600" role="alert">
                {shippingSaveError}
              </p>
            )}
            <button
              type="button"
              onClick={async () => {
                if (!cartId) return;
                setShippingSaveError(null);
                setPreparingPayment(true);
                try {
                  trackFormSubmit({ formName: "checkout_shipping" });
                  trackCheckoutStep({ stepNumber: 2, cartValue: total });
                  // Najpierw czekamy na providerId (prefetched, zwykle < 50 ms),
                  // żeby w 1 request dolecieć shipping + payment-session.
                  // Wcześniej były to 2 sekwencyjne round-tripy (600 + 200 ms)
                  // — teraz jeden ~600-800 ms w jednym HTTP do `/store/custom/prepare-checkout`.
                  const { providerId } = await prefetchPaymentReadiness(
                    getPolishRegionId,
                  );
                  await prepareCheckout(
                    cartId,
                    formData.shippingOptionId,
                    providerId,
                  );
                  await refreshCart().catch(() => undefined);
                  updateField("paymentProviderId", providerId);
                  setStep(3);
                } catch (e) {
                  console.error("[checkout] zapis dostawy/płatności", e);
                  if (isCartAlreadyCompletedError(e)) {
                    setShippingSaveError(
                      "Ten koszyk został już sfinalizowany. Za chwilę zaczniesz od nowa…",
                    );
                    scheduleStaleReset();
                    return;
                  }
                  const message = describeMedusaError(
                    e,
                    "Nie udało się przygotować płatności. Spróbuj ponownie.",
                  );
                  setShippingSaveError(message);
                } finally {
                  setPreparingPayment(false);
                }
              }}
              disabled={!canGoToStep3 || !cartId || preparingPayment}
              className="w-full rounded-md bg-brand-800 py-3 text-sm font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:bg-brand-200 disabled:text-brand-500 transition-colors"
            >
              {preparingPayment ? "Przygotowuję płatność…" : "Przejdź do płatności"}
            </button>
          </section>
        )}

        {/* Step 3 — Payment */}
        {step === 3 && (
          <section className="space-y-6">
            <h2 className="font-display text-xl font-semibold text-brand-800">
              Płatność
            </h2>
            <PaymentSelector
              selectedProviderId={formData.paymentProviderId}
              onSelect={(id: string) => updateField("paymentProviderId", id)}
              availableProviderIds={availableProviderIds}
            />

            <div className="space-y-3 border-t border-brand-100 pt-4">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => updateField("acceptTerms", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-brand-300 text-accent focus:ring-accent"
                />
                <span className="text-xs text-brand-600">
                  Akceptuję{" "}
                  <a href="/regulamin" className="underline hover:text-brand-900">
                    regulamin sklepu
                  </a>{" "}
                  i{" "}
                  <a href="/polityka-prywatnosci" className="underline hover:text-brand-900">
                    politykę prywatności
                  </a>{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptRodo}
                  onChange={(e) => updateField("acceptRodo", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-brand-300 text-accent focus:ring-accent"
                />
                <span className="text-xs text-brand-600">
                  Wyrażam zgodę na przetwarzanie danych osobowych w celu realizacji zamówienia (RODO)
                  <span className="text-red-500"> *</span>
                </span>
              </label>
            </div>

            {submitError && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {submitError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-md bg-brand-800 py-3 text-sm font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:bg-brand-200 disabled:text-brand-500 transition-colors"
            >
              {submitting
                ? formData.paymentProviderId === PRZELEWY24_PROVIDER_ID
                  ? "Przekierowuję do Przelewy24…"
                  : "Składanie zamówienia…"
                : formData.paymentProviderId === SYSTEM_PAYMENT_PROVIDER_ID
                  ? "Zamawiam — opłać przelewem"
                  : "Zamawiam i płacę"}
            </button>
            {submitSlow && submitting && (
              <p
                className="text-center text-xs text-brand-600"
                role="status"
                aria-live="polite"
              >
                Przetwarzamy zamówienie, nie zamykaj tego okna…
              </p>
            )}
            {formData.paymentProviderId === PRZELEWY24_PROVIDER_ID ? (
              <p className="text-center text-[11px] text-brand-400">
                Po kliknięciu przejdziesz do bezpiecznego panelu Przelewy24,
                gdzie dokończysz płatność (BLIK, szybki przelew online, karta).
              </p>
            ) : null}
            {formData.paymentProviderId === SYSTEM_PAYMENT_PROVIDER_ID ? (
              <p className="text-center text-[11px] text-brand-500">
                Po złożeniu zamówienia zobaczysz dane do przelewu na konto{" "}
                {getBankTransferDetails().recipientName}. Realizacja zacznie się po
                zaksięgowaniu wpłaty (zwykle 1–2 dni robocze).
              </p>
            ) : null}
          </section>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <OrderSummary
            selectedShippingOptionId={formData.shippingOptionId}
          />
        </div>
      </div>
    </div>
  );
}
