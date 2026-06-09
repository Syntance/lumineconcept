"use client";

import { useEffect } from "react";
import {
  markCheckoutCompleted,
  readCheckoutCompleted,
} from "@/lib/medusa/checkout";

type Props = {
  orderId?: string;
  displayId?: string;
};

/**
 * Po potwierdzeniu zamówienia utrwala flagę w sessionStorage (blokada powrotu
 * na /checkout) i podmienia wpis w historii, żeby „Wstecz" nie wracało do płatności.
 */
export function CheckoutConfirmationGuard({ orderId, displayId }: Props) {
  useEffect(() => {
    if (orderId) {
      const parsedDisplayId = displayId ? Number(displayId) : undefined;
      markCheckoutCompleted(
        orderId,
        parsedDisplayId && Number.isFinite(parsedDisplayId)
          ? parsedDisplayId
          : undefined,
      );
    }
    const completed = readCheckoutCompleted();
    if (completed && typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.href);
    }
  }, [orderId, displayId]);

  return null;
}
