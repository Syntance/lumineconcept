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
import {
  hasFreeShippingPromotion,
  resolveEffectiveShippingCost,
} from "@/lib/promotions/free-shipping";

type OrderSummaryProps = {
  /**
   * Wybrana opcja dostawy w checkout (Step 2+) — zanim trafi do koszyka Medusy,
   * podsumowanie musi pokazywać jej cenę (np. odbiór osobisty = gratis).
   */
  selectedShippingOptionId?: string;
};

function resolveShippingGross(
  selectedShippingPrice: number | undefined,
  hasShippingMethodSelection: boolean,
  shipping_total: number,
  shippingEstimate: number | null,
  hasFreeShippingPromo: boolean,
): number | null {
  return resolveEffectiveShippingCost({
    hasFreeShippingPromo,
    hasShippingMethodSelection,
    courierShippingTotal: shipping_total,
    selectedShippingPrice,
    shippingEstimate,
  });
}

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
    expressFeeInTotal,
    discountTotal,
    appliedPromoCodes,
  } = useCart();

  /**
   * Dopłata express do WYŚWIETLENIA: client-side surcharge (zanim backend
   * wliczy ją w total) albo kwota metody-dopłaty już siedzącej w koszyku.
   * Nigdy obie naraz (provider zeruje surcharge, gdy fee jest w totalu).
   */
  const expressFeeDisplay = expressSurcharge > 0 ? expressSurcharge : expressFeeInTotal;
  /** Dostawa bez metody-dopłaty express — do wiersza „Dostawa". */
  const courierShippingTotal = Math.max(
    0,
    Math.round((shipping_total - expressFeeInTotal) * 100) / 100,
  );

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

  const hasFreeShippingPromo = hasFreeShippingPromotion(appliedPromoCodes);

  const shippingGross = resolveShippingGross(
    selectedShippingPrice,
    hasShippingMethodSelection,
    courierShippingTotal,
    shippingEstimate,
    hasFreeShippingPromo,
  );

  const shippingDisplay = shippingGross;

  const shippingLabel =
    shippingDisplay === null || shippingDisplay === undefined
      ? "—"
      : shippingDisplay === 0
        ? "gratis"
        : formatPrice(shippingDisplay);

  const displayGrandTotal = useMemo(() => {
    const effectiveShipping = resolveEffectiveShippingCost({
      hasFreeShippingPromo,
      hasShippingMethodSelection,
      courierShippingTotal,
      selectedShippingPrice,
      shippingEstimate,
    });

    const useComputedTotal =
      hasFreeShippingPromo ||
      selectedShippingPrice !== undefined ||
      !hasShippingMethodSelection;

    if (!useComputedTotal) {
      return Math.round((total + expressSurcharge) * 100) / 100;
    }

    const sum =
      productsSubtotal +
      expressFeeDisplay +
      (effectiveShipping ?? 0) +
      tax_total;
    return Math.round(Math.max(0, sum) * 100) / 100;
  }, [
    hasFreeShippingPromo,
    selectedShippingPrice,
    hasShippingMethodSelection,
    shippingEstimate,
    courierShippingTotal,
    total,
    expressSurcharge,
    expressFeeDisplay,
    productsSubtotal,
    tax_total,
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
            {formatPrice(productsSubtotal + discountTotal)}
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
        {expressDelivery && expressFeeDisplay > 0 && (
          <div className="flex justify-between">
            <span className="text-brand-600">Express (+50% produktów)</span>
            <span className="font-medium tabular-nums text-brand-800">
              {formatPrice(expressFeeDisplay)}
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
