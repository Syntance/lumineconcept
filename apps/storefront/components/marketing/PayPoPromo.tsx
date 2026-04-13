import { Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PayPoPromoProps {
  /** Kwota w groszach (Medusa). */
  price: number;
}

const PAYPO_MIN = 4000;
const PAYPO_MAX = 300000;

export function PayPoPromo({ price }: PayPoPromoProps) {
  const isEligible = price >= PAYPO_MIN && price <= PAYPO_MAX;

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
        <span className="font-medium tabular-nums text-brand-800">
          {formatPrice(price)}
        </span>{" "}
        — 0&nbsp;zł odsetek przy płatności w terminie
      </p>
    </div>
  );
}
