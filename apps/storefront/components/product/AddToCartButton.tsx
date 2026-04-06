"use client";

import { ShoppingBag, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
  maxQuantity?: number;
  /** If provided, called before adding to cart. Return true to prevent the default add-to-cart action (e.g. to show a callout first). */
  onBeforeAdd?: () => boolean;
  metadata?: Record<string, string>;
}

export function AddToCartButton({
  variantId,
  productData,
  disabled,
  compact,
  maxQuantity = 99,
  onBeforeAdd,
  metadata,
}: AddToCartButtonProps) {
  const { addItemWithTracking } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [pendingFromCallout, setPendingFromCallout] = useState(false);

  const doAdd = async () => {
    if (!variantId) return;
    setIsAdding(true);
    try {
      await addItemWithTracking(variantId, productData, quantity, metadata);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToCart = () => {
    if (!variantId) return;
    if (onBeforeAdd?.()) {
      setPendingFromCallout(true);
      return;
    }
    doAdd();
  };

  useEffect(() => {
    if (!pendingFromCallout) return;
    const handler = () => {
      setPendingFromCallout(false);
      doAdd();
    };
    window.addEventListener("callout-confirmed-cart", handler);
    const cancel = () => setPendingFromCallout(false);
    window.addEventListener("callout-cancelled", cancel);
    return () => {
      window.removeEventListener("callout-confirmed-cart", handler);
      window.removeEventListener("callout-cancelled", cancel);
    };
  });

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || !variantId || isAdding}
        className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-brand-800 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="flex items-stretch gap-0">
      {/* Quantity selector */}
      <div className="flex items-center border border-r-0 border-brand-300">
        <span className="flex h-full w-11 items-center justify-center text-sm font-medium tabular-nums text-brand-800">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          disabled={quantity >= maxQuantity}
          className="flex h-full items-center border-l border-brand-300 px-3 text-brand-600 hover:text-brand-900 transition-colors disabled:opacity-40"
          aria-label="Zwiększ ilość"
        >
          +
        </button>
      </div>

      {/* Add to cart */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || !variantId || isAdding}
        className="flex flex-1 items-center justify-center gap-2 bg-brand-800 px-6 py-3.5 font-display text-[15px] italic tracking-wide text-white transition-colors hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        dodaj do koszyka
      </button>
    </div>
  );
}
