"use client";

import { useCallback, useState } from "react";
import { searchProducts } from "@/lib/meilisearch/client";
import { trackSearchQuery } from "@/lib/analytics/events";
import type { ProductSearchResult } from "@lumine/types";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback((q: string) => {
    setQuery(q);

    if (q.length < 2) {
      setResults([]);
      setTotalHits(0);
      return;
    }

    setIsSearching(true);

    searchProducts(q, { limit: 10 })
      .then((response) => {
        const hits = response.hits as unknown as ProductSearchResult[];
        setResults(hits);
        setTotalHits(response.estimatedTotalHits ?? 0);
        trackSearchQuery(q, response.estimatedTotalHits ?? 0);
      })
      .catch((err) => {
        console.error("[useSearch] Search failed:", err);
        setResults([]);
      })
      .finally(() => {
        setIsSearching(false);
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
    isSearching,
    search,
    clearSearch,
  };
}
