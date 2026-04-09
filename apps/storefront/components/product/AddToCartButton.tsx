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
        className="flex shrink-0 items-center justify-center gap-2 rounded-none border border-brand-300 bg-brand-800 px-4 py-2.5 font-display text-xs font-semibold italic text-white transition-colors hover:border-brand-400 hover:bg-brand-900 focus-visible:border-brand-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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

  const stepperBtn =
    "flex size-11 shrink-0 items-center justify-center rounded-none border border-brand-300 bg-white font-display text-base leading-none text-neutral-900 transition-colors hover:border-brand-400 hover:bg-brand-50 focus-visible:border-brand-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        disabled={quantity <= 1}
        className={stepperBtn}
        aria-label="Zmniejsz ilość"
      >
        −
      </button>
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-none border border-brand-300 bg-white font-display text-base tabular-nums text-neutral-900"
        aria-live="polite"
      >
        {quantity}
      </div>
      <button
        type="button"
        onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
        disabled={quantity >= maxQuantity}
        className={stepperBtn}
        aria-label="Zwiększ ilość"
      >
        +
      </button>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || !variantId || isAdding}
        className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-none border border-brand-300 bg-brand-800 px-4 font-display text-[15px] italic tracking-wide text-white transition-colors hover:border-brand-400 hover:bg-brand-900 focus-visible:border-brand-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" />
        ) : null}
        dodaj do koszyka
      </button>
    </div>
  );
}
