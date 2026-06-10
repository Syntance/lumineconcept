"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ShieldCheck } from "lucide-react";

type CheckoutTurnstileProps = {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
};

export type CheckoutTurnstileHandle = {
  reset: () => void;
};

/**
 * Cloudflare Turnstile — ograniczona customizacja (iframe CF).
 * Dopasowujemy: light theme, PL, flexible width, wrapper jak trust badges.
 */
export const CheckoutTurnstile = forwardRef<
  CheckoutTurnstileHandle,
  CheckoutTurnstileProps
>(function CheckoutTurnstile(
  { siteKey, onSuccess, onError, onExpire },
  ref,
) {
  const turnstileRef = useRef<TurnstileInstance>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      turnstileRef.current?.reset();
    },
  }));

  return (
    <div className="overflow-hidden rounded-lg border border-brand-100 bg-brand-50/50">
      <div className="flex items-center gap-2.5 border-b border-brand-100 px-4 py-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden />
        <div>
          <p className="text-xs font-semibold text-brand-800">Weryfikacja bezpieczeństwa</p>
          <p className="text-[11px] leading-snug text-brand-600">
            Jednorazowe potwierdzenie przed płatnością
          </p>
        </div>
      </div>

      <div className="checkout-turnstile flex justify-center bg-brand-50 px-4 py-3">
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          options={{
            theme: "light",
            language: "pl",
            size: "flexible",
            refreshExpired: "auto",
          }}
          onSuccess={onSuccess}
          onError={onError}
          onExpire={onExpire}
        />
      </div>
    </div>
  );
});
