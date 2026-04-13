import { Clock } from "lucide-react";

interface PayPoPromoProps {
  /** Kwota w groszach (Medusa). */
  price: number;
}

export const PAYPO_MIN_CENTS = 4000;
export const PAYPO_MAX_CENTS = 300000;

export function isPayPoPriceEligible(price: number): boolean {
  return price >= PAYPO_MIN_CENTS && price <= PAYPO_MAX_CENTS;
}

export function PayPoPromo({ price }: PayPoPromoProps) {
  const isEligible = isPayPoPriceEligible(price);

  if (!isEligible) return null;

  return (
    <div
      className="rounded-none border border-brand-200 bg-brand-50/60 p-4 lg:p-5"
      role="region"
      aria-label="PayPo — płatność odroczona"
    >
      <div className="flex items-center gap-2 text-brand-800">
        <Clock className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">
          PayPo
        </span>
      </div>

      <p className="mt-2 text-sm font-medium text-brand-800">
        Kup teraz, zapłać za 30 dni
      </p>
      <p className="mt-2 text-[11px] leading-snug text-brand-600">
        0&nbsp;zł odsetek przy płatności w terminie
      </p>
    </div>
  );
}
