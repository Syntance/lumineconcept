"use client";

import { useCallback, useState, type MouseEvent, type ReactNode } from "react";
import { useCart } from "@/hooks/useCart";

interface AddToCartButtonProps {
  variantId: string;
  productId: string;
  title: string;
  price: number;
  children: ReactNode;
}

export function AddToCartButton({
  variantId,
  productId,
  title,
  price,
  children,
}: AddToCartButtonProps) {
  const { addItemWithTracking } = useCart();
  const [adding, setAdding] = useState(false);

  const handleClick = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (adding) return;
      setAdding(true);
      try {
        await addItemWithTracking(variantId, {
          id: productId,
          title,
          price,
          currency: "PLN",
        });
      } finally {
        setAdding(false);
      }
    },
    [adding, addItemWithTracking, variantId, productId, title, price],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative shrink-0 flex w-full items-center justify-center rounded-md border border-[#EEE8E0] bg-white py-2 px-3 transition-all duration-200 group-hover:bg-[#EEE8E0]"
    >
      <span className="transition-opacity duration-200 group-hover:opacity-0">
        {children}
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.15em] text-brand-800 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {adding ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-800" />
            Dodaję…
          </span>
        ) : (
          "Dodaj do koszyka"
        )}
      </span>
    </button>
  );
}
