"use client";

import { useState } from "react";
import { ShippingSelector } from "./ShippingSelector";
import { PaymentSelector } from "./PaymentSelector";
import { OrderSummary } from "./OrderSummary";
import { trackFormStart, trackFormSubmit } from "@/lib/analytics/events";

type CheckoutStep = "shipping" | "payment" | "review";

export function CheckoutForm() {
  const [step, setStep] = useState<CheckoutStep>("shipping");
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
    inpostLockerId: "",
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleShippingSubmit = () => {
    trackFormSubmit("checkout_shipping");
    setStep("payment");
  };

  const handlePaymentSubmit = () => {
    trackFormSubmit("checkout_payment");
    setStep("review");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <section>
          <h2 className="font-display text-xl font-semibold text-brand-800 mb-6">
            Dane kontaktowe
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-brand-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onFocus={() => trackFormStart("checkout")}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="twoj@email.pl"
              />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-brand-700 mb-1">
                Imię
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-brand-700 mb-1">
                Nazwisko
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-brand-700 mb-1">
                Telefon
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="+48 000 000 000"
              />
            </div>
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-brand-700 mb-1">
                Kod pocztowy
              </label>
              <input
                id="postalCode"
                type="text"
                required
                value={formData.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
                className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="00-000"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-brand-700 mb-1">
                Adres
              </label>
              <input
                id="address"
                type="text"
                required
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="ul. Przykładowa 1/2"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-brand-700 mb-1">
                Miasto
              </label>
              <input
                id="city"
                type="text"
                required
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="w-full rounded-md border border-brand-200 px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              />
            </div>
          </div>
        </section>

        {step !== "shipping" || formData.email ? (
          <section>
            <h2 className="font-display text-xl font-semibold text-brand-800 mb-6">
              Sposób dostawy
            </h2>
            <ShippingSelector
              selectedOptionId={formData.shippingOptionId}
              onSelect={(id: string) => updateField("shippingOptionId", id)}
              onInPostLockerSelect={(id: string) =>
                updateField("inpostLockerId", id)
              }
            />
            {formData.shippingOptionId && step === "shipping" && (
              <button
                type="button"
                onClick={handleShippingSubmit}
                className="mt-6 w-full rounded-md bg-brand-900 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
              >
                Przejdź do płatności
              </button>
            )}
          </section>
        ) : null}

        {step === "payment" || step === "review" ? (
          <section>
            <h2 className="font-display text-xl font-semibold text-brand-800 mb-6">
              Płatność
            </h2>
            <PaymentSelector
              selectedProviderId={formData.paymentProviderId}
              onSelect={(id: string) => updateField("paymentProviderId", id)}
            />
            {formData.paymentProviderId && step === "payment" && (
              <button
                type="button"
                onClick={handlePaymentSubmit}
                className="mt-6 w-full rounded-md bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
              >
                Zamawiam i płacę
              </button>
            )}
          </section>
        ) : null}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
