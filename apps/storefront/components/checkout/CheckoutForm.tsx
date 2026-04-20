"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@lumine/types";
import { ShippingSelector } from "./ShippingSelector";
import { PaymentSelector } from "./PaymentSelector";
import { OrderSummary } from "./OrderSummary";
import {
  trackFormStart,
  trackFormSubmit,
  trackCheckoutStepCompleted,
  trackPurchase,
} from "@/lib/analytics/events";
import { useCart } from "@/hooks/useCart";
import {
  completeCart,
  initPaymentSession,
  saveContactDetails,
  selectShippingOption,
} from "@/lib/medusa/checkout";

/**
 * Testowy dostawca płatności (Medusa 2 instaluje go domyślnie jako manual).
 * Docelowo: `przelewy24` / `paypo` — podmieni się po integracji bramek.
 */
const TEST_PAYMENT_PROVIDER_ID = "pp_system_default";

type CheckoutStep = 1 | 2 | 3;

const STEPS = [
  { number: 1, label: "Dane" },
  { number: 2, label: "Dostawa" },
  { number: 3, label: "Płatność" },
] as const;

const INPUT_CLASS =
  "w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";
const LABEL_CLASS = "block text-sm font-medium text-brand-700 mb-1";

export function CheckoutForm() {
  const router = useRouter();
  const { id: cartId, items, total, refreshCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [formStarted, setFormStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [preparingDelivery, setPreparingDelivery] = useState(false);
  const [contactSaveError, setContactSaveError] = useState<string | null>(null);
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [shippingSaveError, setShippingSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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
  });

  const updateField = useCallback(
    <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleFocus = useCallback(() => {
    if (!formStarted) {
      setFormStarted(true);
      trackFormStart("checkout");
    }
  }, [formStarted]);

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
    !submitting;

  const handleSubmit = useCallback(async () => {
    if (!cartId) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    setSubmitting(true);
    trackFormSubmit("checkout_payment");

    try {
      const result = await completeCart(cartId);

      if (result.type !== "order") {
        const msg =
          (result as { error?: { message?: string } }).error?.message ??
          "Nie udało się utworzyć zamówienia (cart nie przeszedł w order).";
        throw new Error(msg);
      }

      trackCheckoutStepCompleted(3, "payment");
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
      });

      try {
        localStorage.removeItem("lumine_cart_id");
        localStorage.removeItem("lumine_express");
      } catch {
        /* prywatny tryb */
      }
      await refreshCart().catch(() => undefined);

      const qs = new URLSearchParams({ order_id: result.order.id });
      if (result.order.display_id) qs.set("display_id", String(result.order.display_id));
      router.push(`/checkout/potwierdzenie?${qs.toString()}`);
    } catch (e) {
      console.error("[checkout] błąd składania zamówienia", e);
      const message =
        e instanceof Error
          ? e.message
          : "Nie udało się złożyć zamówienia. Spróbuj ponownie.";
      setSubmitError(message);
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [cartId, items, total, refreshCart, router]);

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
                    step >= s.number ? "bg-accent" : "bg-brand-200"
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
                    ? "bg-accent text-white"
                    : step > s.number
                      ? "bg-accent/10 text-accent-dark cursor-pointer"
                      : "bg-brand-100 text-brand-400"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
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
                  trackFormSubmit("checkout_contact");
                  trackCheckoutStepCompleted(1, "contact");
                  await saveContactDetails(cartId, formData.email, address);
                  setStep(2);
                } catch (e) {
                  console.error("[checkout] zapis przed dostawą", e);
                  const detail =
                    e instanceof Error && e.message
                      ? ` (${e.message})`
                      : "";
                  setContactSaveError(
                    `Nie udało się zapisać danych. Sprawdź połączenie i spróbuj ponownie.${detail}`,
                  );
                } finally {
                  setPreparingDelivery(false);
                }
              }}
              disabled={!canGoToStep2 || !cartId || preparingDelivery}
              className="w-full rounded-md bg-brand-900 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
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
                  trackFormSubmit("checkout_shipping");
                  trackCheckoutStepCompleted(2, "shipping");
                  await selectShippingOption(cartId, formData.shippingOptionId);
                  await initPaymentSession(cartId, TEST_PAYMENT_PROVIDER_ID);
                  setStep(3);
                } catch (e) {
                  console.error("[checkout] zapis dostawy/płatności", e);
                  setShippingSaveError(
                    "Nie udało się przygotować płatności. Spróbuj ponownie.",
                  );
                } finally {
                  setPreparingPayment(false);
                }
              }}
              disabled={!canGoToStep3 || !cartId || preparingPayment}
              className="w-full rounded-md bg-brand-900 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
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
              className="w-full rounded-md bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {submitting ? "Składanie zamówienia…" : "Zamawiam i płacę"}
            </button>
            <p className="text-center text-[11px] text-brand-400">
              Tryb testowy — zamówienie trafia do Medusy bez rzeczywistej
              płatności (bramki skonfigurujemy na końcu).
            </p>
          </section>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
