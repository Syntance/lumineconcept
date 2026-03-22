import Link from "next/link";
import type { ProductSearchResult } from "@lumine/types";
import { formatPrice } from "@/lib/utils";

interface SearchResultsProps {
  results: ProductSearchResult[];
  onSelect: () => void;
}

export function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <p className="text-center text-sm text-brand-400 py-8">
        Brak wyników. Spróbuj innej frazy.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {results.map((product) => {
        const minPrice = Math.min(...(product.variant_prices ?? [0]));
        return (
          <li key={product.id}>
            <Link
              href={`/produkty/${product.handle}`}
              onClick={onSelect}
              className="flex items-center gap-4 rounded-lg p-3 hover:bg-brand-50 transition-colors"
            >
              <div className="h-14 w-14 flex-shrink-0 rounded-md bg-brand-100 overflow-hidden">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-brand-300 text-xs">
                    Brak
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-900 truncate">
                  {product.title}
                </p>
                <p className="text-xs text-brand-500 line-clamp-1">
                  {product.description}
                </p>
              </div>
              <span className="text-sm font-semibold text-brand-900 tabular-nums">
                {minPrice > 0 ? `od ${formatPrice(minPrice)}` : "—"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
