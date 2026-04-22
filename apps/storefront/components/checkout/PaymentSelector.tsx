"use client";

import { CreditCard, Clock, ReceiptText } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

/**
 * Medusa v2: kwoty w PLN (dziesiętne). PayPo działa w zakresie 40–3000 zł
 * (limity z dokumentacji). Wcześniej trzymaliśmy grosze, stąd × 100.
 */
const PAYPO_MIN_AMOUNT = 40;
const PAYPO_MAX_AMOUNT = 3000;

/** ID providera `@medusajs/payment/providers/system` (manual). */
const SYSTEM_PAYMENT_PROVIDER_ID = "pp_system_default";

interface PaymentOption {
  id: string;
  name: string;
  description: string;
  icon: typeof CreditCard;
  methods?: string[];
  /** `true` → opcja jest w pełni obsługiwana w bieżącej iteracji. */
  enabled: boolean;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: SYSTEM_PAYMENT_PROVIDER_ID,
    name: "Przelew tradycyjny (tryb testowy)",
    description:
      "Zamówienie trafia do Admina Medusy bez rzeczywistego pobrania środków.",
    icon: ReceiptText,
    enabled: true,
  },
  {
    id: "przelewy24",
    name: "Przelewy24",
    description: "BLIK, przelew bankowy, karta płatnicza (wkrótce)",
    icon: CreditCard,
    methods: ["BLIK", "Przelew", "Karta"],
    enabled: false,
  },
  {
    id: "paypo",
    name: "PayPo — Kup teraz, zapłać za 30 dni",
    description: "Płatność odroczona bez dodatkowych kosztów (wkrótce)",
    icon: Clock,
    enabled: false,
  },
];

interface PaymentSelectorProps {
  selectedProviderId: string;
  onSelect: (providerId: string) => void;
}

export function PaymentSelector({
  selectedProviderId,
  onSelect,
}: PaymentSelectorProps) {
  const { grandTotal } = useCart();
  const isPayPoEligible =
    grandTotal >= PAYPO_MIN_AMOUNT && grandTotal <= PAYPO_MAX_AMOUNT;

  return (
    <div className="space-y-3">
      {PAYMENT_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedProviderId === option.id;
        const isDisabled =
          !option.enabled || (option.id === "paypo" && !isPayPoEligible);

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => !isDisabled && onSelect(option.id)}
            disabled={isDisabled}
            className={`w-full flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
              isSelected
                ? "border-brand-900 bg-accent/15 shadow-sm"
                : isDisabled
                  ? "border-brand-100 bg-brand-50 opacity-60 cursor-not-allowed"
                  : "border-brand-200 hover:border-brand-400 hover:bg-brand-50"
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                isSelected ? "border-brand-900" : "border-brand-300"
              }`}
            >
              {isSelected && (
                <div className="h-2.5 w-2.5 rounded-full bg-brand-900" />
              )}
            </div>
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
            <div className="flex-1">
              <span className="text-sm font-medium text-brand-900">
                {option.name}
              </span>
              <p className="text-xs text-brand-500 mt-0.5">
                {option.description}
              </p>

              {option.methods && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {option.methods.map((method) => (
                    <span
                      key={method}
                      className="rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              )}

              {option.id === "paypo" && (
                <div className="mt-2 rounded bg-purple-50 px-3 py-2">
                  {isPayPoEligible ? (
                    <p className="text-xs text-purple-700">
                      Zapłać{" "}
                      <span className="font-medium text-brand-800 tabular-nums">
                        {formatPrice(grandTotal)}
                      </span>{" "}
                      za 30 dni — 0 zł odsetek
                    </p>
                  ) : (
                    <p className="text-xs text-purple-500">
                      PayPo dostępne dla zamówień{" "}
                      <span className="font-medium text-brand-800 tabular-nums">
                        {formatPrice(PAYPO_MIN_AMOUNT)}
                      </span>
                      {" – "}
                      <span className="font-medium text-brand-800 tabular-nums">
                        {formatPrice(PAYPO_MAX_AMOUNT)}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
