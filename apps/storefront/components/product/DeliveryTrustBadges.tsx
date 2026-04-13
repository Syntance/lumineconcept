"use client";

import { Clock, Truck, Wallet } from "lucide-react";
import { isPayPoPriceEligible } from "@/components/marketing/PayPoPromo";

interface DeliveryTrustBadgesProps {
  /** Kwota w groszach (Medusa). */
  price: number;
}

export function DeliveryTrustBadges({ price }: DeliveryTrustBadgesProps) {
  const showPayPo = isPayPoPriceEligible(price);

  return (
    <div
      className="flex flex-col gap-4 text-brand-700 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-6 sm:gap-y-3"
      role="list"
      aria-label="Płatności i dostawa"
    >
      <div role="listitem" className="flex items-start gap-2.5 sm:max-w-[13rem]">
        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-800">Przelewy24</p>
          <p className="text-xs leading-snug text-brand-600">
            BLIK, przelew, karta
          </p>
        </div>
      </div>

      <span className="hidden text-brand-300 sm:inline sm:pt-1" aria-hidden>
        &middot;
      </span>

      <div role="listitem" className="flex items-start gap-2.5 sm:max-w-[13rem]">
        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-800">DPD</p>
          <p className="text-xs leading-snug text-brand-600">
            Przesyłka kurierska pod wskazany adres
          </p>
        </div>
      </div>

      {showPayPo && (
        <>
          <span className="hidden text-brand-300 sm:inline sm:pt-1" aria-hidden>
            &middot;
          </span>
          <div role="listitem" className="flex items-start gap-2.5 sm:max-w-[15rem]">
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
        </>
      )}
    </div>
  );
}
