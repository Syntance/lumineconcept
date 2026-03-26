"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export function KoszykClient() {
  const { items, itemCount } = useCart();

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Strona główna", href: "/" },
          { label: "Koszyk" },
        ]}
      />

      <h1 className="font-display text-2xl font-bold text-brand-800 mb-8">
        Koszyk ({itemCount})
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <ShoppingBag className="h-16 w-16 text-brand-200" />
          <p className="text-lg text-brand-500">Twój koszyk jest pusty</p>
          <Link
            href="/sklep"
            className="mt-4 rounded-md bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
          >
            Przeglądaj produkty
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
          <div>
            <div className="sticky top-24 rounded-lg border border-brand-200 bg-brand-50/50 p-6">
              <CartSummary />
              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-md bg-brand-900 py-3 text-center text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
              >
                Przejdź do płatności
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
