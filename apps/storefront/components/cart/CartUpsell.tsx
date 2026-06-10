"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackCrossSellClick } from "@/lib/analytics/events";

interface UpsellProduct {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number;
}

interface CartUpsellProps {
  currentItemIds: string[];
}

export function CartUpsell({ currentItemIds }: CartUpsellProps) {
  const [suggestions, setSuggestions] = useState<UpsellProduct[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    fetch("/api/products?_limit=4&_offset=0", { signal: abortController.signal })
      .then((res) => res.json())
      .then((data: { products: UpsellProduct[] }) => {
        const filtered = data.products.filter((p) => !currentItemIds.includes(p.id));
        setSuggestions(filtered.slice(0, 3));
      })
      .catch(() => {});

    return () => abortController.abort();
  }, [currentItemIds]);

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-lg border border-brand-100 p-3">
      <p className="mb-2 text-xs font-medium text-brand-700">Może Ci się spodobać</p>
      <div className="space-y-2">
        {suggestions.map((p) => (
          <Link
            key={p.id}
            href={`/sklep/gotowe-wzory/${p.handle}`}
            onClick={() =>
              trackCrossSellClick({
                fromProduct: currentItemIds[0],
                toProduct: p.id,
              })
            }
            className="flex items-center gap-3 rounded-md p-1.5 transition-colors hover:bg-brand-50"
          >
            {p.thumbnail ? (
              <div className="relative h-12 w-[2.25rem] overflow-hidden rounded-md">
                <div className="absolute inset-0 bg-brand-50" aria-hidden />
                <Image
                  src={p.thumbnail}
                  alt={p.title}
                  width={36}
                  height={48}
                  className="relative z-10 rounded-md object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-[2.25rem] rounded-md bg-brand-100" />
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-brand-800">{p.title}</p>
              {p.price > 0 && (
                <p className="text-[11px] text-brand-500">
                  {p.price.toFixed(2).replace(".", ",")} PLN
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
