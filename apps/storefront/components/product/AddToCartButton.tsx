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
          disabled={quantity <= 1}
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
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          disabled={quantity >= maxQuantity}
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
        Dodaj do koszyka
      </button>
    </div>
  );
}
