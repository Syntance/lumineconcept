"use client";

import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";

export function CartDrawer() {
  const { isOpen, closeCart, items, itemCount } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Koszyk">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
        onKeyDown={(e) => e.key === "Escape" && closeCart()}
        role="button"
        tabIndex={-1}
        aria-label="Zamknij koszyk"
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-brand-100 p-4">
          <h2 className="font-display text-lg font-semibold text-brand-900">
            Koszyk ({itemCount})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 -mr-2 text-brand-700 hover:text-brand-900"
            aria-label="Zamknij koszyk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <ShoppingBag className="h-12 w-12 text-brand-200" />
            <p className="text-brand-500">Twój koszyk jest pusty</p>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-md bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent-dark transition-colors"
            >
              Przeglądaj produkty
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            <div className="border-t border-brand-100 p-4 space-y-4">
              <CartSummary />
              <Link
                href="/koszyk"
                onClick={closeCart}
                className="block w-full rounded-md bg-accent py-3 text-center text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
              >
                Przejdź do koszyka
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full rounded-md border border-brand-900 bg-brand-900 py-3 text-center text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
              >
                Zamów teraz
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
