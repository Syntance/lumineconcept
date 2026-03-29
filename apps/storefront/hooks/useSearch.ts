"use client";

import { useCallback, useRef, useState } from "react";
import { searchProducts } from "@/lib/meilisearch/client";
import { trackSearchQuery } from "@/lib/analytics/events";
import type { ProductSearchResult } from "@lumine/types";

const DEBOUNCE_MS = 250;

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const search = useCallback((q: string) => {
    setQuery(q);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (q.length < 2) {
      setResults([]);
      setTotalHits(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    timerRef.current = setTimeout(() => {
      const id = ++requestIdRef.current;

      searchProducts(q, { limit: 10 })
        .then((response) => {
          if (id !== requestIdRef.current) return;
          const hits = response.hits as unknown as ProductSearchResult[];
          setResults(hits);
          setTotalHits(response.estimatedTotalHits ?? 0);
          trackSearchQuery(q, response.estimatedTotalHits ?? 0);
        })
        .catch((err) => {
          if (id !== requestIdRef.current) return;
          console.error("[useSearch] Search failed:", err);
          setResults([]);
        })
        .finally(() => {
          if (id !== requestIdRef.current) return;
          setIsSearching(false);
        });
    }, DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    requestIdRef.current++;
    setQuery("");
    setResults([]);
    setTotalHits(0);
    setIsSearching(false);
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
