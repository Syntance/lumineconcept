"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { getShippingOptions } from "@/lib/medusa/checkout";

interface ShippingOptionView {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface ShippingSelectorProps {
  selectedOptionId: string;
  onSelect: (optionId: string) => void;
}

export function ShippingSelector({
  selectedOptionId,
  onSelect,
}: ShippingSelectorProps) {
  const { id: cartId } = useCart();
  const [options, setOptions] = useState<ShippingOptionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cartId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getShippingOptions(cartId)
      .then((raw) => {
        if (cancelled) return;
        const list = (raw ?? []) as unknown as Array<Record<string, unknown>>;
        const mapped: ShippingOptionView[] = list.map((o) => ({
          id: String(o.id),
          name: (o.name as string | undefined) ?? "Dostawa",
          price: Number(o.amount ?? o.price ?? 0),
          description: (o.data as { description?: string } | undefined)?.description,
        }));
        setOptions(mapped);
        if (mapped.length === 1 && !selectedOptionId) {
          onSelect(mapped[0].id);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        console.error("[shipping] fetch", e);
        setError("Nie udało się pobrać opcji dostawy.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cartId, onSelect, selectedOptionId]);

  if (loading) {
    return <p className="text-sm text-brand-500">Ładowanie opcji dostawy…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-brand-500">
        Brak aktywnych metod dostawy dla tego koszyka. Skonfiguruj je w Medusa
        Admin (Shipping profiles / Regions).
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {options.map((option) => {
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
              {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
            </div>
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-900">{option.name}</span>
                <span className="text-sm font-semibold tabular-nums text-brand-800">
                  {option.price > 0 ? formatPrice(option.price) : "gratis"}
                </span>
              </div>
              {option.description && (
                <p className="text-xs text-brand-500 mt-0.5">{option.description}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
