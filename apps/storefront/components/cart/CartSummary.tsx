"use client";

import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export function CartSummary() {
  const { subtotal, shipping_total, total } = useCart();

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-brand-600">Wartość produktów</span>
        <span className="font-medium tabular-nums text-brand-800">
          {formatPrice(subtotal)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-brand-600">Dostawa</span>
        <span className="font-medium tabular-nums text-brand-800">
          {shipping_total > 0 ? formatPrice(shipping_total) : "Do ustalenia"}
        </span>
      </div>
      <div className="flex justify-between border-t border-brand-100 pt-2 text-base font-semibold text-brand-800">
        <span>Razem</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>
    </div>
  );
}
