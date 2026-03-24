import type { CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CloudinaryImage } from "../common/CloudinaryImage";
import { PriceDisplay } from "./PriceDisplay";

/** Jak łuk cienia w hero (40% elipsa); „w górę” = łuk u góry karty, „w dół” = łuk u dołu. */
export type ProductCardFrameVariant = "square" | "arch-up" | "arch-down";

interface ProductCardProps {
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  frameVariant?: ProductCardFrameVariant;
  /** Tylko zdjęcie (np. Bestsellery); tytuł i cena poza kartą */
  imageOnly?: boolean;
  /** Domyślnie `aspect-square`; np. `aspect-[4/5]` — nieco wyższe zdjęcie */
  imageAspectClassName?: string;
  /** Sam `<article>` bez `<Link>` — link owija rodzic (np. cała kolumna Bestsellerów) */
  linkless?: boolean;
  /** Ostre kąty (radius 0) — tylko przy `frameVariant="square"`; przy łuku arch-up/arch-down ignorowane */
  sharpCorners?: boolean;
  /** Tło pola zdjęcia (np. `bg-white` w Bestsellerach przy braku miniatury) */
  imageAreaClassName?: string;
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
}: ProductCardProps) {
  const sharpSquare = sharpCorners && frameVariant === "square";

  const archFrameStyle: CSSProperties | undefined = sharpSquare
    ? { borderRadius: 0 }
    : frameVariant === "arch-up"
      ? {
          /* Łuk u góry jak wcześniej; dolne rogi ostre (0) */
          borderRadius: "50% 50% 0 0 / 40% 40% 0 0",
        }
      : frameVariant === "arch-down"
        ? {
          /* Górne rogi ostre (0); łuk u dołu jak w hero */
          borderRadius: "0 0 50% 50% / 0 0 40% 40%",
        }
        : undefined;

  const articleRadiusClass = sharpSquare
    ? "rounded-none"
    : frameVariant === "square"
      ? "rounded-lg"
      : "";

  const imageIsPortrait = imageAspectClassName !== "aspect-square";
  const imageWidth = 600;
  const imageHeight = imageIsPortrait ? 750 : 600;

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
      </div>
      {!imageOnly && (
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-4">
          <h3 className="min-h-11 shrink-0 text-sm font-medium leading-snug text-brand-800 line-clamp-2">
            {title}
          </h3>
          <div className="shrink-0">
            <PriceDisplay
              amount={price}
              compareAtAmount={compareAtPrice}
              currency={currency}
            />
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
      href={`/produkty/${handle}`}
      className="group flex h-full min-h-0 w-full min-w-0 flex-col"
      aria-label={imageOnly ? title : undefined}
    >
      {article}
    </Link>
  );
}
