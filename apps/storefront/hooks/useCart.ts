"use client";

import { useCartContext } from "@/providers/CartProvider";
import { trackAddToCart } from "@/lib/analytics/events";

export function useCart() {
  const cart = useCartContext();

  const addItemWithTracking = async (
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
  };

  return {
    ...cart,
    addItemWithTracking,
  };
}
