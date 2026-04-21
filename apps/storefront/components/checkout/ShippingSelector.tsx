"use client";

import { useEffect, useRef, useState } from "react";
import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import {
  ensureLumineShippingBootstrap,
  getShippingOptions,
} from "@/lib/medusa/checkout";

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

function mapOptions(
  raw: Array<Record<string, unknown>> | null | undefined,
): ShippingOptionView[] {
  const list = (raw ?? []) as Array<Record<string, unknown>>;
  return list.map((o) => {
    const calc = o.calculated_price as
      | { calculated_amount?: number }
      | undefined;
    const amount =
      Number(o.amount ?? o.price ?? calc?.calculated_amount ?? 0) || 0;
    return {
      id: String(o.id),
      name: (o.name as string | undefined) ?? "Dostawa",
      price: amount,
      description: (o.data as { description?: string } | undefined)?.description,
    };
  });
}

export function ShippingSelector({
  selectedOptionId,
  onSelect,
}: ShippingSelectorProps) {
  const { id: cartId } = useCart();
  const [options, setOptions] = useState<ShippingOptionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ensureAttempted = useRef(false);

  /**
   * Fetch opcji odpalamy TYLKO kiedy zmieni się koszyk — `selectedOptionId`
   * jest stanem „lokalnym" formularza i nie powinien powodować ponownego
   * listowania metod w Medusie. Osobny useEffect poniżej obsługuje
   * auto-select po załadowaniu listy.
   */
  useEffect(() => {
    ensureAttempted.current = false;
    if (!cartId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        let raw = await getShippingOptions(cartId);
        if (cancelled) return;
        if (!raw?.length && !ensureAttempted.current) {
          ensureAttempted.current = true;
          await ensureLumineShippingBootstrap();
          if (!cancelled) {
            raw = await getShippingOptions(cartId);
          }
        }
        if (cancelled) return;
        setOptions(
          mapOptions(raw as unknown as Array<Record<string, unknown>>),
        );
      } catch (e: unknown) {
        if (cancelled) return;
        console.error("[shipping] fetch", e);
        setError("Nie udało się pobrać opcji dostawy.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cartId]);

  // Auto-select pierwszej (i jedynej) opcji, jeśli nic nie zostało wybrane.
  useEffect(() => {
    const only = options.length === 1 ? options[0] : null;
    if (only && !selectedOptionId) {
      onSelect(only.id);
    }
  }, [options, selectedOptionId, onSelect]);

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
