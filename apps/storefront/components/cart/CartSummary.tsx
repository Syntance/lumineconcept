"use client";

import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export function CartSummary() {
  const {
    productsSubtotal,
    shipping_total,
    shippingEstimate,
    hasShippingMethodSelection,
    expressDelivery,
    expressSurcharge,
    expressFeeInTotal,
    discountTotal,
    grandTotal,
  } = useCart();

  // Dopłata express do wyświetlenia: client-side surcharge albo metoda-dopłata
  // już wliczona w total przez backend (prepare-checkout) — nigdy obie.
  const expressFeeDisplay = expressSurcharge > 0 ? expressSurcharge : expressFeeInTotal;
  // Wiersz „Dostawa" bez metody-dopłaty express.
  const courierShippingTotal = Math.max(
    0,
    Math.round((shipping_total - expressFeeInTotal) * 100) / 100,
  );

  const shippingDisplay =
    courierShippingTotal > 0
      ? courierShippingTotal
      : hasShippingMethodSelection
        ? 0
        : shippingEstimate;

  const shippingLabel =
    shippingDisplay === null || shippingDisplay === undefined
      ? "Do ustalenia"
      : hasShippingMethodSelection && courierShippingTotal === 0
        ? "gratis"
        : formatPrice(shippingDisplay);

  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <span className="text-brand-500">Produkty</span>
        <span className="tabular-nums text-brand-700">
          {formatPrice(productsSubtotal)}
        </span>
      </div>
      {expressDelivery && expressFeeDisplay > 0 && (
        <div className="flex justify-between">
          <span className="text-brand-500">Express (+50% produktów)</span>
          <span className="tabular-nums text-brand-700">
            {formatPrice(expressFeeDisplay)}
          </span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-brand-500">Dostawa</span>
        <span className="tabular-nums text-brand-700">{shippingLabel}</span>
      </div>
      {discountTotal > 0 && (
        <div className="flex justify-between">
          <span className="text-brand-500">Zniżka</span>
          <span className="tabular-nums text-emerald-700">−{formatPrice(discountTotal)}</span>
        </div>
      )}
      <div className="h-px bg-brand-100" />
      <div className="flex justify-between pt-0.5 text-base">
        <span className="font-medium text-brand-800">Razem</span>
        <span className="font-semibold tabular-nums text-brand-900">
          {formatPrice(grandTotal)}
        </span>
      </div>
    </div>
  );
}
