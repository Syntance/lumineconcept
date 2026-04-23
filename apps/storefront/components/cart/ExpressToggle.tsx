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
          Chcę ekspres · +50% wart. zam.{" "}
          <span className="font-normal text-brand-500">· 3 dni robocze</span>
        </span>
      </label>
    );
  }

  return (
    <div className="border border-brand-300 bg-brand-50/90 p-4 shadow-md lg:p-5">
      <div className="flex items-start gap-2.5 text-brand-900">
        <Zap
          className="mt-0.5 h-4 w-4 shrink-0 text-brand-800"
          strokeWidth={2}
          aria-hidden
        />
        <p className="min-w-0 leading-snug sm:text-base">
          <span className="font-display text-sm font-bold uppercase tracking-[0.12em] text-brand-900 sm:text-base">
            Realizacja ekspress
          </span>
          <span className="text-base font-normal text-brand-800">
            {" "}
            - <strong className="font-semibold">3 dni</strong> robocze zamiast 10.
          </span>
        </p>
      </div>

      <label className="mt-5 inline-flex w-fit max-w-full cursor-pointer items-center gap-3 border border-brand-300 bg-brand-800 px-3 py-2.5 font-display text-sm font-semibold tracking-wide text-white transition-colors hover:border-brand-400 hover:bg-brand-900 focus-within:outline-none focus-within:ring-2 focus-within:ring-white/30">
        <input
          type="checkbox"
          checked={expressDelivery}
          onChange={(e) => toggle(e.target.checked)}
          className="h-5 w-5 shrink-0 rounded-none border border-white/50 bg-brand-800 accent-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        />
        <span className="font-sans text-base text-white">
          Chcę ekspres · +50% wartości zamówienia
        </span>
      </label>
    </div>
  );
}
