"use client";

import { useEffect, useRef } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { MIN_PRODUCT_SEARCH_LENGTH } from "@/lib/products/product-search";
import { SearchResults } from "./SearchResults";

interface SearchModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const { query, results, isSearching, search, clearSearch } = useSearch();

	useEffect(() => {
		let focusTimer: ReturnType<typeof setTimeout> | null = null;
		if (isOpen) {
			document.body.style.overflow = "hidden";
			focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
		} else {
			document.body.style.overflow = "";
			clearSearch();
		}
		return () => {
			if (focusTimer) clearTimeout(focusTimer);
			document.body.style.overflow = "";
		};
	}, [isOpen, clearSearch]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				if (isOpen) onClose();
			}
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Wyszukiwarka">
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
				role="button"
				tabIndex={-1}
				aria-label="Zamknij wyszukiwarkę"
			/>
			<div className="fixed inset-x-4 top-24 mx-auto max-w-2xl rounded-xl bg-white shadow-2xl">
				<div className="flex items-center gap-2 border-b border-brand-100 px-4">
					<Search className="h-5 w-5 shrink-0 text-brand-400" aria-hidden />
					<input
						ref={inputRef}
						type="text"
						role="searchbox"
						placeholder="Szukaj produktów po nazwie, opisie…"
						value={query}
						onChange={(e) => search(e.target.value)}
						className="min-w-0 flex-1 py-4 text-sm outline-none placeholder:text-brand-400"
						aria-label="Szukaj produktów"
						enterKeyHint="search"
						autoComplete="off"
					/>
					{isSearching ? (
						<Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-400" aria-hidden />
					) : null}
					<button
						type="button"
						onClick={onClose}
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-brand-100 text-brand-600 transition-colors hover:bg-brand-200 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						aria-label="Zamknij wyszukiwarkę"
					>
						<X className="h-4 w-4" aria-hidden />
					</button>
				</div>

				<div className="max-h-96 overflow-y-auto p-4">
					{query.trim().length >= MIN_PRODUCT_SEARCH_LENGTH ? (
						<SearchResults results={results} onSelect={onClose} />
					) : (
						<p className="py-8 text-center text-sm text-brand-400">
							Wpisz minimum {MIN_PRODUCT_SEARCH_LENGTH} znaki, aby wyszukać…
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
