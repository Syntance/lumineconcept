"use client";

import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export function CartSummary() {
  const {
    subtotal,
    shipping_total,
    expressDelivery,
    expressSurcharge,
    grandTotal,
  } = useCart();

  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <span className="text-brand-500">Produkty</span>
        <span className="tabular-nums text-brand-700">{formatPrice(subtotal)}</span>
      </div>
      {expressDelivery && expressSurcharge > 0 && (
        <div className="flex justify-between">
          <span className="text-brand-500">Ekspress (+50% produktów)</span>
          <span className="tabular-nums text-brand-700">
            {formatPrice(expressSurcharge)}
          </span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-brand-500">Dostawa</span>
        <span className="tabular-nums text-brand-700">
          {shipping_total > 0 ? formatPrice(shipping_total) : "Do ustalenia"}
        </span>
      </div>
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
