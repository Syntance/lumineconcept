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
        thumbnail?: string;
      },
      quantity = 1,
      metadata?: Record<string, string>,
      options?: {
        openDrawer?: boolean;
      },
    ) => {
      /**
       * Optymistyczny preview — dzięki temu drawer koszyka pokazuje nową
       * pozycję natychmiast po kliknięciu, a backend Medusy (nawet po
       * zmianach infry dalej 400-600 ms na add-line-item) ściga się z UI
       * w tle. Trackowanie analytics strzelamy też natychmiast — to OK,
       * bo jeśli backend odrzuci, my i tak rollbackujemy koszyk.
       */
      await cart.addItem(variantId, quantity, metadata, options?.openDrawer ?? true, {
        title: productData.title,
        thumbnail: productData.thumbnail,
        unit_price: productData.price,
      });
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
