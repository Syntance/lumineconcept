"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { ExpressToggle } from "@/components/cart/ExpressToggle";
import { CartConfiguratorDetails } from "@/components/cart/CartConfiguratorDetails";
import { PromoCodeField } from "@/components/checkout/PromoCodeField";
import { formatPrice } from "@/lib/utils";
import {
  normalizeShippingOptionsForDisplay,
  prefetchShippingOptions,
} from "@/lib/medusa/checkout";

type OrderSummaryProps = {
  /**
   * Wybrana opcja dostawy w checkout (Step 2+) — zanim trafi do koszyka Medusy,
   * podsumowanie musi pokazywać jej cenę (np. odbiór osobisty = gratis).
   */
  selectedShippingOptionId?: string;
};

export function OrderSummary({ selectedShippingOptionId }: OrderSummaryProps) {
  const {
    id: cartId,
    items,
    productsSubtotal,
    shipping_total,
    shippingEstimate,
    hasShippingMethodSelection,
    tax_total,
    total,
    expressDelivery,
    expressSurcharge,
    discountTotal,
    grandTotal,
  } = useCart();

  /** id → cena z prefetchu; lookup synchroniczny przy zmianie wyboru w Step 2. */
  const [shippingOptionPrices, setShippingOptionPrices] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!cartId) {
      setShippingOptionPrices({});
      return;
    }
    let cancelled = false;
    void prefetchShippingOptions(cartId)
      .then((raw) => {
        if (cancelled) return;
        const opts = normalizeShippingOptionsForDisplay(
          raw as unknown as Array<Record<string, unknown>>,
        );
        setShippingOptionPrices(
          Object.fromEntries(opts.map((o) => [o.id, o.price])),
        );
      })
      .catch(() => {
        if (!cancelled) setShippingOptionPrices({});
      });
    return () => {
      cancelled = true;
    };
  }, [cartId]);

  const selectedShippingPrice =
    selectedShippingOptionId &&
    selectedShippingOptionId in shippingOptionPrices
      ? shippingOptionPrices[selectedShippingOptionId]
      : undefined;

  const shippingDisplay = useMemo(() => {
    // Wybór w checkout ma pierwszeństwo — user może przełączyć kurier ↔ odbiór
    // zanim ponownie kliknie „Przejdź do płatności”.
    if (selectedShippingPrice !== undefined) {
      return selectedShippingPrice;
    }
    if (hasShippingMethodSelection) {
      return shipping_total > 0 ? shipping_total : 0;
    }
    return shippingEstimate;
  }, [
    selectedShippingPrice,
    hasShippingMethodSelection,
    shipping_total,
    shippingEstimate,
  ]);

  const shippingLabel =
    shippingDisplay === null || shippingDisplay === undefined
      ? "—"
      : shippingDisplay === 0
        ? "gratis"
        : formatPrice(shippingDisplay);

  const displayGrandTotal = useMemo(() => {
    if (selectedShippingPrice !== undefined) {
      const baseWithoutCommittedShipping = hasShippingMethodSelection
        ? total - shipping_total
        : total;
      return (
        Math.round(
          (baseWithoutCommittedShipping +
            expressSurcharge +
            selectedShippingPrice) *
            100,
        ) / 100
      );
    }
    if (hasShippingMethodSelection) return grandTotal;
    const shippingAddon = shippingEstimate ?? 0;
    return Math.round((total + expressSurcharge + shippingAddon) * 100) / 100;
  }, [
    selectedShippingPrice,
    hasShippingMethodSelection,
    grandTotal,
    shippingEstimate,
    total,
    shipping_total,
    expressSurcharge,
  ]);

  return (
    <div className="rounded-none border border-brand-200 bg-brand-50/50 p-6">
      <h3 className="font-display text-lg font-semibold text-brand-800 mb-4">
        Podsumowanie
      </h3>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="h-12 w-9 shrink-0 overflow-hidden rounded-none bg-white">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-brand-100" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-brand-900 truncate">
                {item.title}
              </p>
              <CartConfiguratorDetails metadata={item.metadata} density="compact" />
              <p className="text-xs text-brand-500">
                Ilość: {item.quantity}
              </p>
            </div>
            <span className="text-xs font-medium tabular-nums text-brand-800">
              {formatPrice(item.total)}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <ExpressToggle compact />
      </div>

      <div className="mb-4">
        <PromoCodeField compact />
      </div>

      <div className="border-t border-brand-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-brand-600">Produkty</span>
          <span className="font-medium tabular-nums text-brand-800">
            {formatPrice(productsSubtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-600">Realizacja</span>
          <span className="font-medium text-brand-800">
            {expressDelivery
              ? "Express: 3 dni robocze"
              : "ok. 10 dni roboczych"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-600">Dostawa</span>
          <span className="font-medium tabular-nums text-brand-800">
            {shippingLabel}
          </span>
        </div>
        {expressDelivery && expressSurcharge > 0 && (
          <div className="flex justify-between">
            <span className="text-brand-600">Express (+50% produktów)</span>
            <span className="font-medium tabular-nums text-brand-800">
              {formatPrice(expressSurcharge)}
            </span>
          </div>
        )}
        {discountTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-brand-600">Zniżka</span>
            <span className="font-medium tabular-nums text-emerald-700">
              −{formatPrice(discountTotal)}
            </span>
          </div>
        )}
        {tax_total > 0 && (
          <div className="flex justify-between">
            <span className="text-brand-600">VAT</span>
            <span className="font-medium tabular-nums text-brand-800">
              {formatPrice(tax_total)}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-brand-200 pt-2 text-base font-semibold text-brand-800">
          <span>Do zapłaty</span>
          <span className="tabular-nums">{formatPrice(displayGrandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
