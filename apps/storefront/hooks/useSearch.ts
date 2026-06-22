"use client";

import { useCallback, useRef, useState } from "react";
import { track } from "@/lib/analytics/track";
import {
	MIN_PRODUCT_SEARCH_LENGTH,
} from "@/lib/products/product-search";
import {
	plainProductDescription,
	type SimpleProduct,
} from "@/lib/products/simple-product";
import type { ProductSearchResult } from "@lumine/types";

const DEBOUNCE_MS = 250;
const MODAL_SEARCH_LIMIT = 10;

function toSearchResult(product: SimpleProduct): ProductSearchResult {
	return {
		id: product.id,
		title: product.title,
		handle: product.handle,
		thumbnail: product.thumbnail ?? undefined,
		description: plainProductDescription(product.description) ?? "",
		variant_prices: product.price > 0 ? [product.price] : [],
	};
}

export function useSearch() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<ProductSearchResult[]>([]);
	const [totalHits, setTotalHits] = useState(0);
	const [isSearching, setIsSearching] = useState(false);

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestIdRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);

	const search = useCallback((q: string) => {
		setQuery(q);

		if (timerRef.current) clearTimeout(timerRef.current);
		abortRef.current?.abort();

		const trimmed = q.trim();
		if (trimmed.length < MIN_PRODUCT_SEARCH_LENGTH) {
			setResults([]);
			setTotalHits(0);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);

		timerRef.current = setTimeout(() => {
			const id = ++requestIdRef.current;
			const controller = new AbortController();
			abortRef.current = controller;

			const params = new URLSearchParams({
				q: trimmed,
				_limit: String(MODAL_SEARCH_LIMIT),
				_offset: "0",
			});

			fetch(`/api/products?${params}`, { signal: controller.signal })
				.then(async (res) => {
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					return res.json() as Promise<{ products: SimpleProduct[]; count: number }>;
				})
				.then((data) => {
					if (id !== requestIdRef.current) return;
					setResults(data.products.map(toSearchResult));
					setTotalHits(data.count);
					track("search", {
						search_term: trimmed,
						results_count: data.count,
					});
				})
				.catch((err) => {
					if (id !== requestIdRef.current) return;
					if (err instanceof DOMException && err.name === "AbortError") return;
					console.error("[useSearch] Search failed:", err);
					setResults([]);
					setTotalHits(0);
				})
				.finally(() => {
					if (id !== requestIdRef.current) return;
					setIsSearching(false);
				});
		}, DEBOUNCE_MS);
	}, []);

	const clearSearch = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		abortRef.current?.abort();
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
