import { cn, formatPrice } from "@/lib/utils";

interface PriceDisplayProps {
  amount: number;
  compareAtAmount?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  prefix?: string;
  /** Wymusza rozmiar w px (strona produktu) — omija klasy Tailwind, gdy coś je nadpisuje. */
  fontSizePx?: number;
}

export function PriceDisplay({
  amount,
  compareAtAmount,
  currency = "PLN",
  size = "md",
  prefix,
  fontSizePx,
}: PriceDisplayProps) {
  const hasDiscount = compareAtAmount && compareAtAmount > amount;
  const discountPercent = hasDiscount
    ? Math.round((1 - amount / compareAtAmount) * 100)
    : 0;

  const sizeClasses = {
    sm: "text-[0.9375rem]", // ~+7% względem text-sm
    md: "text-[1.0625rem]", // ~+6% względem text-base
    lg: "text-[1.3125rem]", // ~+6% względem text-xl
  };

  const sizeStyle =
    fontSizePx != null ? ({ fontSize: `${fontSizePx}px` } as const) : undefined;
  const sizeClass = fontSizePx != null ? undefined : sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      {prefix && (
        <span className="text-xs text-brand-400">{prefix}</span>
      )}
      <span
        style={sizeStyle}
        className={cn(
          "font-semibold",
          sizeClass,
          hasDiscount ? "text-red-600" : "text-brand-800",
        )}
      >
        {formatPrice(amount, currency)}
      </span>
      {hasDiscount && (
        <>
          <span
            style={sizeStyle}
            className={cn(sizeClass, "text-brand-400 line-through")}
          >
            {formatPrice(compareAtAmount, currency)}
          </span>
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
