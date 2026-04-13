"use client";

import { Clock, Truck, Wallet } from "lucide-react";
import { isPayPoPriceEligible } from "@/components/marketing/PayPoPromo";
import { cn } from "@/lib/utils";

interface DeliveryTrustBadgesProps {
  /** Kwota w groszach (Medusa). */
  price: number;
}

export function DeliveryTrustBadges({ price }: DeliveryTrustBadgesProps) {
  const showPayPo = isPayPoPriceEligible(price);

  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-4 text-brand-700 sm:items-start sm:gap-6",
        showPayPo ? "sm:grid-cols-3" : "sm:grid-cols-2",
      )}
      role="list"
      aria-label="Płatności i dostawa"
    >
      <div role="listitem" className="flex min-w-0 items-start gap-2.5">
        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-800">Przelewy24</p>
          <p className="text-xs leading-snug text-brand-600">
            BLIK, przelew, karta
          </p>
        </div>
      </div>

      <div role="listitem" className="flex min-w-0 items-start gap-2.5">
        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-800">DPD</p>
          <p className="text-xs leading-snug text-brand-600">
            Przesyłka kurierska pod wskazany adres
          </p>
        </div>
      </div>

      {showPayPo && (
        <div role="listitem" className="flex min-w-0 items-start gap-2.5">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-800">PayPo</p>
            <p className="text-xs leading-snug text-brand-700">
              Kup teraz, zapłać za 30 dni
            </p>
            <p className="mt-1 text-[11px] leading-snug text-brand-600">
              0&nbsp;zł odsetek przy płatności w terminie
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
