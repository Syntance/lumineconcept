import { formatPrice } from "@/lib/utils";

interface PriceDisplayProps {
  amount: number;
  compareAtAmount?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({
  amount,
  compareAtAmount,
  currency = "PLN",
  size = "md",
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

  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-semibold ${sizeClasses[size]} ${
          hasDiscount ? "text-red-600" : "text-brand-800"
        }`}
      >
        {formatPrice(amount, currency)}
      </span>
      {hasDiscount && (
        <>
          <span className={`${sizeClasses[size]} text-brand-400 line-through`}>
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
