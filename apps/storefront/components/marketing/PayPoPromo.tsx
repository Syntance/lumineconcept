import { Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PayPoPromoProps {
  price: number;
}

const PAYPO_MIN = 4000;
const PAYPO_MAX = 300000;

export function PayPoPromo({ price }: PayPoPromoProps) {
  const isEligible = price >= PAYPO_MIN && price <= PAYPO_MAX;

  if (!isEligible) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
      <Clock className="h-5 w-5 text-purple-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-purple-800">
          Kup teraz, zapłać za 30 dni
        </p>
        <p className="text-xs text-purple-600">
          <span className="font-medium text-brand-800">{formatPrice(price)}</span>{" "}
          z PayPo — 0 zł odsetek
        </p>
      </div>
    </div>
  );
}
