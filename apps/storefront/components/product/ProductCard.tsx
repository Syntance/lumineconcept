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
      className="group block"
    >
      <article className="overflow-hidden rounded-lg border border-brand-100 bg-white transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-brand-50">
          {thumbnail ? (
            <CloudinaryImage
              publicId={thumbnail}
              alt={title}
              width={600}
              height={600}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-300">
              <span className="text-sm">Brak zdjęcia</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-medium text-brand-900 line-clamp-2">
            {title}
          </h3>
          <div className="mt-2">
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
