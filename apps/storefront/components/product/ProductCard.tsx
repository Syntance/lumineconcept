import Link from "next/link";
import { CloudinaryImage } from "../common/CloudinaryImage";
import { PriceDisplay } from "./PriceDisplay";

interface ProductCardProps {
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number;
  compareAtPrice?: number;
  currency?: string;
}

export function ProductCard({
  handle,
  title,
  thumbnail,
  price,
  compareAtPrice,
  currency = "PLN",
}: ProductCardProps) {
  return (
    <Link
      href={`/produkty/${handle}`}
      className="group flex h-full min-h-0 w-full min-w-0 flex-col"
    >
      <article className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-brand-100 bg-white transition-shadow hover:shadow-md">
        {/* Stały blok 1:1 — zawsze ta sama wysokość względem szerokości kolumny */}
        <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-brand-50">
          {thumbnail ? (
            <CloudinaryImage
              publicId={thumbnail}
              alt={title}
              width={600}
              height={600}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-brand-300">
              <span className="text-sm">Brak zdjęcia</span>
            </div>
          )}
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-4">
          <h3 className="min-h-11 shrink-0 text-sm font-medium leading-snug text-brand-900 line-clamp-2">
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
      </article>
    </Link>
  );
}
