import type { CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CloudinaryImage } from "../common/CloudinaryImage";
import { PriceDisplay } from "./PriceDisplay";

export type ProductCardFrameVariant = "square" | "arch-up" | "arch-down";

interface ProductCardProps {
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  frameVariant?: ProductCardFrameVariant;
  imageOnly?: boolean;
  imageAspectClassName?: string;
  linkless?: boolean;
  sharpCorners?: boolean;
  imageAreaClassName?: string;
  href?: string;
  badge?: "bestseller" | "nowość" | null;
  colorSwatches?: string[];
  hasVariantPrices?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  czarny: "#1a1a1a",
  biały: "#ffffff",
  złoty: "#D4AF37",
  "rose gold": "#B76E79",
  srebrny: "#C0C0C0",
  przezroczysty: "transparent",
  różowy: "#E8A0BF",
  beżowy: "#D4C5B2",
  szary: "#8B8B8B",
  brązowy: "#6B4226",
};

function resolveSwatchColor(name: string): string {
  return COLOR_MAP[name.toLowerCase()] ?? "#ccc";
}

export function ProductCard({
  handle,
  title,
  thumbnail,
  price,
  compareAtPrice,
  currency = "PLN",
  frameVariant = "square",
  imageOnly = false,
  imageAspectClassName = "aspect-square",
  linkless = false,
  sharpCorners = false,
  imageAreaClassName = "bg-brand-50",
  href,
  badge,
  colorSwatches,
  hasVariantPrices = false,
}: ProductCardProps) {
  const sharpSquare = sharpCorners && frameVariant === "square";

  const archFrameStyle: CSSProperties | undefined = sharpSquare
    ? { borderRadius: 0 }
    : frameVariant === "arch-up"
      ? { borderRadius: "50% 50% 0 0 / 40% 40% 0 0" }
      : frameVariant === "arch-down"
        ? { borderRadius: "0 0 50% 50% / 0 0 40% 40%" }
        : undefined;

  const articleRadiusClass = sharpSquare
    ? "rounded-none"
    : frameVariant === "square"
      ? "rounded-lg"
      : "";

  const imageIsPortrait = imageAspectClassName !== "aspect-square";
  const imageWidth = 600;
  const imageHeight = imageIsPortrait ? 750 : 600;

  const visibleSwatches = colorSwatches?.slice(0, 5) ?? [];
  const extraSwatchCount = (colorSwatches?.length ?? 0) - 5;

  const article = (
    <article
      className={`flex h-full min-h-0 w-full flex-col overflow-hidden border border-brand-100 bg-white transition-shadow group-hover:shadow-md ${articleRadiusClass}`}
      style={archFrameStyle}
    >
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden",
          imageAreaClassName,
          imageAspectClassName,
        )}
      >
        {thumbnail ? (
          <CloudinaryImage
            publicId={thumbnail}
            alt={title}
            width={imageWidth}
            height={imageHeight}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-brand-400">
            <span className="text-sm">Brak zdjęcia</span>
          </div>
        )}
        {badge && (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white",
              badge === "bestseller" ? "bg-accent" : "bg-green-600",
            )}
          >
            {badge === "bestseller" ? "Bestseller" : "Nowość"}
          </span>
        )}
      </div>
      {!imageOnly && (
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-4">
          <h3 className="min-h-11 shrink-0 text-sm font-medium leading-snug text-brand-800 line-clamp-2">
            {title}
          </h3>
          {visibleSwatches.length > 0 && (
            <div className="flex items-center gap-1">
              {visibleSwatches.map((color) => (
                <span
                  key={color}
                  className="inline-block h-3 w-3 rounded-full border border-brand-200"
                  style={{ backgroundColor: resolveSwatchColor(color) }}
                  title={color}
                />
              ))}
              {extraSwatchCount > 0 && (
                <span className="text-[10px] text-brand-400">+{extraSwatchCount}</span>
              )}
            </div>
          )}
          <div className="relative shrink-0 flex items-center justify-center rounded-md border border-[#EEE8E0] bg-white py-2 px-3 transition-all duration-200 group-hover:bg-[#EEE8E0]">
            <span className="transition-opacity duration-200 group-hover:opacity-0">
              <PriceDisplay
                amount={price}
                compareAtAmount={compareAtPrice}
                currency={currency}
                prefix={hasVariantPrices ? "od" : undefined}
              />
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.15em] text-brand-800 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Zobacz produkt
            </span>
          </div>
        </div>
      )}
    </article>
  );

  if (linkless) {
    return article;
  }

  return (
    <Link
      href={href ?? `/sklep/gotowe-wzory/${handle}`}
      className="group flex h-full min-h-0 w-full min-w-0 flex-col"
      aria-label={imageOnly ? title : undefined}
    >
      {article}
    </Link>
  );
}
