import { cn, formatPrice } from "@/lib/utils";

interface PriceDisplayProps {
  amount: number;
  compareAtAmount?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  prefix?: string;
  /** Wymusza rozmiar w px (strona produktu) — omija klasy Tailwind, gdy coś je nadpisuje. */
  fontSizePx?: number;
  /** Ciemny badge (PDP) — brązowe tło + biały tekst, kursywa display. */
  variant?: "default" | "badge";
}

export function PriceDisplay({
  amount,
  compareAtAmount,
  currency = "PLN",
  size = "md",
  prefix,
  fontSizePx,
  variant = "default",
}: PriceDisplayProps) {
  const hasDiscount = compareAtAmount && compareAtAmount > amount;
  const discountPercent = hasDiscount
    ? Math.round((1 - amount / compareAtAmount) * 100)
    : 0;

  const sizeClasses = {
    sm: "text-[1rem]",
    md: "text-[1.125rem]",
    lg: "text-[1.375rem]",
  };

  const sizeStyle =
    fontSizePx != null ? ({ fontSize: `${fontSizePx}px` } as const) : undefined;
  const sizeClass = fontSizePx != null ? undefined : sizeClasses[size];

  if (variant === "badge") {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-block bg-brand-800 px-5 py-1.5 font-display text-[1.125rem] italic text-white">
          {formatPrice(amount, currency)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-base text-brand-400 line-through">
              {formatPrice(compareAtAmount, currency)}
            </span>
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-sm font-medium text-red-700">
              -{discountPercent}%
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {prefix && (
        <span className="text-sm text-brand-400">{prefix}</span>
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
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-sm font-medium text-red-700">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
