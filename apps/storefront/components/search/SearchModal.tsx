"use client";

import { useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { SearchResults } from "./SearchResults";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, results, isSearching, search, clearSearch } = useSearch();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      clearSearch();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, clearSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!isOpen) {
          /* parent handles open */
        } else {
          onClose();
        }
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
        <div className="flex items-center gap-3 border-b border-brand-100 px-4">
          <Search className="h-5 w-5 text-brand-400" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Szukaj produktów..."
            value={query}
            onChange={(e) => search(e.target.value)}
            className="flex-1 py-4 text-sm outline-none placeholder:text-brand-400"
            aria-label="Szukaj produktów"
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-brand-400" />}
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-brand-100 px-2 py-1 text-xs text-brand-600"
          >
            ESC
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          {query.length >= 2 ? (
            <SearchResults results={results} onSelect={onClose} />
          ) : (
            <p className="text-center text-sm text-brand-400 py-8">
              Wpisz minimum 2 znaki, aby wyszukać...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
