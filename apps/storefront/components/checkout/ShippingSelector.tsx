"use client";

import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const SHIPPING_OPTIONS = [
  {
    id: "dpd_courier",
    name: "Kurier DPD",
    price: 2500,
    estimated: "1–3 dni robocze po nadaniu",
    icon: Truck,
    description: "Przesyłka kurierska pod wskazany adres",
  },
] as const;

interface ShippingSelectorProps {
  selectedOptionId: string;
  onSelect: (optionId: string) => void;
}

export function ShippingSelector({
  selectedOptionId,
  onSelect,
}: ShippingSelectorProps) {
  return (
    <div className="space-y-3">
      {SHIPPING_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedOptionId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`w-full flex items-start gap-4 rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? "border-accent bg-accent/5"
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
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-900">
                  {option.name}
                </span>
                <span className="text-sm font-semibold tabular-nums text-brand-800">
                  od {formatPrice(option.price)}
                </span>
              </div>
              <p className="text-xs text-brand-500 mt-0.5">
                {option.description} · {option.estimated}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
