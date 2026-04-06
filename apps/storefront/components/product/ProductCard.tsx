import type { CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getProductDimensionsLabel } from "@/lib/products/dimensions";
import type { GlobalConfigOption } from "@/lib/products/global-config";
import { CloudinaryImage } from "../common/CloudinaryImage";
import { PriceDisplay } from "./PriceDisplay";
import { AddToCartButton } from "./AddToCartOverlay";

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
  hasVariantPrices?: boolean;
  variantId?: string;
  productId?: string;
  productOptions?: Record<string, string[]>;
  linksCount?: number;
  productMetadata?: Record<string, unknown>;
  /** Gdy wymiary są tylko na wariancie (Medusa). */
  variantMetadata?: Record<string, unknown>;
  globalColors?: GlobalConfigOption[];
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
  imageAspectClassName = "aspect-[10/11]",
  linkless = false,
  sharpCorners = false,
  imageAreaClassName = "bg-brand-50",
  href,
  badge,
  hasVariantPrices = false,
  variantId,
  productId,
  productOptions,
  linksCount,
  productMetadata,
  variantMetadata,
  globalColors,
}: ProductCardProps) {
  const dimensionsLabel = getProductDimensionsLabel(productMetadata, variantMetadata);

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

  const imageIsPortrait = imageAspectClassName !== "aspect-square" && imageAspectClassName !== "aspect-[10/11]";
  const imageWidth = 600;
  const imageHeight = imageIsPortrait ? 750 : 600;

  const articleBody = (
    <article
      className={`relative z-1 flex h-full min-h-0 w-full flex-col overflow-hidden border border-brand-100 bg-white transition-shadow group-hover:shadow-md ${articleRadiusClass}`}
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
          <>
            <CloudinaryImage
              publicId={thumbnail}
              alt={title}
              width={imageWidth}
              height={imageHeight}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <img
              src="/images/watermark.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-2 z-10 h-5 w-auto select-none opacity-30"
              style={{ filter: "brightness(0) invert(1)" }}
              draggable={false}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-brand-400">
            <span className="text-sm">Brak zdjęcia</span>
          </div>
        )}
        {badge && (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white",
              badge === "bestseller" ? "bg-accent" : "bg-green-600",
            )}
          >
            {badge === "bestseller" ? "Bestseller" : "Nowość"}
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center bg-brand-900/70 py-2.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          Zobacz produkt
        </span>
      </div>
      {!imageOnly && (
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-4">
          <h3 className="min-h-9 shrink-0 text-xs font-medium leading-snug text-brand-800 line-clamp-2">
            {title}
          </h3>
          {dimensionsLabel && (
            <p className="text-sm text-brand-500 line-clamp-2">
              <span className="text-brand-400">Wymiary:</span> {dimensionsLabel}
            </p>
          )}
          {variantId && productId ? (
            <div className="pointer-events-auto">
              <AddToCartButton
                variantId={variantId}
                productId={productId}
                title={title}
                price={price}
                thumbnail={thumbnail}
                options={productOptions}
                linksCount={linksCount}
                href={href ?? `/sklep/gotowe-wzory/${handle}`}
                metadata={productMetadata}
                globalColors={globalColors}
              >
                <PriceDisplay
                  amount={price}
                  compareAtAmount={compareAtPrice}
                  currency={currency}
                  size="lg"
                />
              </AddToCartButton>
            </div>
          ) : (
            <div className="relative shrink-0 flex items-center justify-center rounded-md border border-brand-100 bg-white py-2 px-3 transition-all duration-200 group-hover:bg-brand-100">
              <span className="transition-opacity duration-200 group-hover:opacity-0">
                <PriceDisplay
                  amount={price}
                  compareAtAmount={compareAtPrice}
                  currency={currency}
                  size="lg"
                />
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold uppercase tracking-[0.15em] text-brand-800 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Zobacz produkt
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  );

  if (linkless) {
    return articleBody;
  }

  const productHref = href ?? `/sklep/gotowe-wzory/${handle}`;

  return (
    <div className="group relative flex h-full min-h-0 w-full min-w-0 flex-col">
      <Link
        href={productHref}
        className="absolute inset-0 z-0"
        aria-label={imageOnly ? title : `Zobacz produkt: ${title}`}
      />
      <div className="pointer-events-none flex h-full min-h-0 w-full min-w-0 flex-col">
        {articleBody}
      </div>
    </div>
  );
}
