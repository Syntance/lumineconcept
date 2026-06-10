"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { ShieldCheck } from "lucide-react";

type CheckoutTurnstileProps = {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
};

/**
 * Cloudflare Turnstile — ograniczona customizacja (iframe CF).
 * Dopasowujemy: light theme, PL, flexible width, wrapper jak trust badges.
 */
export function CheckoutTurnstile({
  siteKey,
  onSuccess,
  onError,
  onExpire,
}: CheckoutTurnstileProps) {
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
          siteKey={siteKey}
          options={{
            theme: "light",
            language: "pl",
            size: "flexible",
          }}
          onSuccess={onSuccess}
          onError={onError}
          onExpire={onExpire}
        />
      </div>

      <p className="border-t border-brand-100 px-4 py-2 text-[11px] leading-snug text-brand-500">
        Obsługiwane przez Cloudflare. Bez dodatkowych plików cookie marketingowych.
      </p>
    </div>
  );
}
