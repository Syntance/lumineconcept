"use client";

import { Zap } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface ExpressToggleProps {
  compact?: boolean;
}

export function ExpressToggle({ compact = false }: ExpressToggleProps) {
  const { expressDelivery, setExpressDelivery } = useCart();

  const toggle = (checked: boolean) => void setExpressDelivery(checked);

  if (compact) {
    return (
      <label className="flex cursor-pointer items-center gap-2.5 border border-brand-200 bg-brand-50/60 px-4 py-3">
        <input
          type="checkbox"
          checked={expressDelivery}
          onChange={(e) => toggle(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded-none border-brand-300 accent-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35"
        />
        <Zap
          className="h-3.5 w-3.5 shrink-0 text-brand-800"
          strokeWidth={2}
          aria-hidden
        />
        <span className="text-xs font-medium text-brand-800">
          Ekspress{" "}
          <span className="font-normal text-brand-500">(3 dni robocze)</span>
        </span>
      </label>
    );
  }

  return (
    <div className="border border-brand-200 bg-brand-50/60 p-4 lg:p-5">
      <div className="flex items-center gap-2 text-brand-800">
        <Zap
          className="h-4 w-4 shrink-0 text-brand-800"
          strokeWidth={2}
          aria-hidden
        />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Realizacja ekspress
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-snug text-brand-600">
        ok. 3 dni robocze zamiast ok. 10 dni roboczych — potrzebujesz szybciej?
      </p>

      <label className="mt-3 flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={expressDelivery}
          onChange={(e) => toggle(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded-none border-brand-300 accent-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35"
        />
        <span className="text-xs font-medium text-brand-700">
          Tak, chcę ekspress
        </span>
      </label>
    </div>
  );
}
