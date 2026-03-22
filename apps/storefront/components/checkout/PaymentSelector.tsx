"use client";

import { CreditCard, Clock } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

const PAYPO_MIN_AMOUNT = 4000;
const PAYPO_MAX_AMOUNT = 300000;

interface PaymentOption {
  id: string;
  name: string;
  description: string;
  icon: typeof CreditCard;
  methods?: string[];
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "przelewy24",
    name: "Przelewy24",
    description: "BLIK, przelew bankowy, karta płatnicza",
    icon: CreditCard,
    methods: ["BLIK", "Przelew", "Karta"],
  },
  {
    id: "paypo",
    name: "PayPo — Kup teraz, zapłać za 30 dni",
    description: "Płatność odroczona bez dodatkowych kosztów",
    icon: Clock,
  },
];

interface PaymentSelectorProps {
  selectedProviderId: string;
  onSelect: (providerId: string) => void;
  cartTotal?: number;
}

export function PaymentSelector({
  selectedProviderId,
  onSelect,
}: PaymentSelectorProps) {
  const { total } = useCart();
  const isPayPoEligible =
    total >= PAYPO_MIN_AMOUNT && total <= PAYPO_MAX_AMOUNT;

  return (
    <div className="space-y-3">
      {PAYMENT_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedProviderId === option.id;
        const isDisabled = option.id === "paypo" && !isPayPoEligible;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => !isDisabled && onSelect(option.id)}
            disabled={isDisabled}
            className={`w-full flex items-start gap-4 rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? "border-accent bg-accent/5"
                : isDisabled
                  ? "border-brand-100 bg-brand-50 opacity-60 cursor-not-allowed"
                  : "border-brand-200 hover:border-brand-300"
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                isSelected ? "border-accent" : "border-brand-300"
              }`}
            >
              {isSelected && (
                <div className="h-2.5 w-2.5 rounded-full bg-accent" />
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
                      Zapłać {formatPrice(total)} za 30 dni — 0 zł odsetek
                    </p>
                  ) : (
                    <p className="text-xs text-purple-500">
                      PayPo dostępne dla zamówień {formatPrice(PAYPO_MIN_AMOUNT)} –{" "}
                      {formatPrice(PAYPO_MAX_AMOUNT)}
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
