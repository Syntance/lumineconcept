"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";

const SearchModal = dynamic(
  () => import("../search/SearchModal").then((m) => m.SearchModal),
  { ssr: false },
);

const CartDrawer = dynamic(
  () => import("../cart/CartDrawer").then((m) => m.CartDrawer),
  { ssr: false },
);

/**
 * Mały island: wyszukiwarka + konto + koszyk (z badge). Liczba w koszyku
 * czyta się z `useCart()` (client storage), więc SSRu i tak nie miałby
 * tu jak znać prawidłowej wartości — zostawiamy to jako island.
 */
export function HeaderIcons() {
  const { itemCount, openCart } = useCart();
  const [isSearchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="p-2 text-brand-600 hover:text-brand-900 transition-colors"
          aria-label="Szukaj"
        >
          <Search className="h-4 w-4" />
        </button>
        <Link
          href="/konto"
          className="hidden sm:block p-2 text-brand-600 hover:text-brand-900 transition-colors"
          aria-label="Moje konto"
        >
          <User className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={openCart}
          className="relative p-2 text-brand-600 hover:text-brand-900 transition-colors"
          aria-label={`Koszyk (${itemCount} produktów)`}
        >
          <ShoppingBag className="h-4 w-4" />
          {itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-800 px-0.5 text-[10px] font-bold tabular-nums leading-none text-white ring-2 ring-white shadow-sm">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setSearchOpen(false)}
      />
      <CartDrawer />
    </>
  );
}
