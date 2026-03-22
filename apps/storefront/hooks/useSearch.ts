"use client";

import { useCallback, useState, useTransition } from "react";
import { searchProducts } from "@/lib/meilisearch/client";
import { trackSearchQuery } from "@/lib/analytics/events";
import type { ProductSearchResult } from "@lumine/types";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isPending, startTransition] = useTransition();

  const search = useCallback((q: string) => {
    setQuery(q);

    if (q.length < 2) {
      setResults([]);
      setTotalHits(0);
      return;
    }

    startTransition(async () => {
      const response = await searchProducts(q, { limit: 10 });
      const hits = response.hits as unknown as ProductSearchResult[];
      setResults(hits);
      setTotalHits(response.estimatedTotalHits ?? 0);
      trackSearchQuery(q, response.estimatedTotalHits ?? 0);
    });
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setTotalHits(0);
  }, []);

  return {
    query,
    results,
    totalHits,
    isSearching: isPending,
    search,
    clearSearch,
  };
}
