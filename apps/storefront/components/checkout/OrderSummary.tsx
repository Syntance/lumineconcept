"use client";

import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export function OrderSummary() {
  const { items, subtotal, shipping_total, tax_total, total } = useCart();

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-6">
      <h3 className="font-display text-lg font-semibold text-brand-900 mb-4">
        Podsumowanie
      </h3>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="h-12 w-12 flex-shrink-0 rounded bg-white overflow-hidden">
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
              <p className="text-xs text-brand-500">
                Ilość: {item.quantity}
              </p>
            </div>
            <span className="text-xs font-medium text-brand-900 tabular-nums">
              {formatPrice(item.total)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-brand-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-brand-600">
          <span>Produkty</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-brand-600">
          <span>Dostawa</span>
          <span>
            {shipping_total > 0 ? formatPrice(shipping_total) : "—"}
          </span>
        </div>
        {tax_total > 0 && (
          <div className="flex justify-between text-brand-600">
            <span>VAT</span>
            <span>{formatPrice(tax_total)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-brand-200 pt-2 text-base font-semibold text-brand-900">
          <span>Do zapłaty</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
