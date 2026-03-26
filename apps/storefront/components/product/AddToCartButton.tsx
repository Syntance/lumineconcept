"use client";

import { ShoppingBag, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";

interface AddToCartButtonProps {
  variantId: string | null;
  productData: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
  disabled?: boolean;
  compact?: boolean;
}

export function AddToCartButton({
  variantId,
  productData,
  disabled,
  compact,
}: AddToCartButtonProps) {
  const { addItemWithTracking } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    if (!variantId) return;
    setIsAdding(true);
    try {
      await addItemWithTracking(variantId, productData, quantity);
    } finally {
      setIsAdding(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || !variantId || isAdding}
        className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingBag className="h-4 w-4" />
        )}
        Dodaj
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-md border border-brand-200">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-brand-700 hover:text-brand-900 transition-colors"
          aria-label="Zmniejsz ilość"
        >
          -
        </button>
        <span className="w-10 text-center text-sm font-medium tabular-nums">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          className="px-3 py-2 text-brand-700 hover:text-brand-900 transition-colors"
          aria-label="Zwiększ ilość"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || !variantId || isAdding}
        className="flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingBag className="h-4 w-4" />
        )}
        {!variantId ? "Wybierz wariant" : "Dodaj do koszyka"}
      </button>
    </div>
  );
}
