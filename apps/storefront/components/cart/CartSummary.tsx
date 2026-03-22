"use client";

import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export function CartSummary() {
  const { subtotal, shipping_total, total } = useCart();

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-brand-600">
        <span>Wartość produktów</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-brand-600">
        <span>Dostawa</span>
        <span>
          {shipping_total > 0 ? formatPrice(shipping_total) : "Do ustalenia"}
        </span>
      </div>
      <div className="flex justify-between border-t border-brand-100 pt-2 text-base font-semibold text-brand-900">
        <span>Razem</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
