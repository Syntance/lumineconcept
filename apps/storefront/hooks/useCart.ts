"use client";

import { useCallback } from "react";
import { useCartContext } from "@/providers/CartProvider";
import { trackAddToCart } from "@/lib/analytics/events";

export function useCart() {
  const cart = useCartContext();

  const addItemWithTracking = useCallback(
    async (
      variantId: string,
      productData: {
        id: string;
        title: string;
        price: number;
        currency: string;
      },
      quantity = 1,
    ) => {
      await cart.addItem(variantId, quantity);
      trackAddToCart({
        id: productData.id,
        title: productData.title,
        price: productData.price,
        currency: productData.currency,
        quantity,
      });
    },
    [cart.addItem],
  );

  return {
    ...cart,
    addItemWithTracking,
  };
}
