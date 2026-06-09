"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { SORT_OPTIONS } from "@/components/product/filter-types";
import { cn } from "@/lib/utils";

type SortSelectProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** sm = mobile pasek, md = desktop obok wyszukiwarki */
  size?: "sm" | "md";
};

export function SortSelect({ value, onChange, className, size = "md" }: SortSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const triggerId = useId();

  const selected = SORT_OPTIONS.find((opt) => opt.value === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Sortowanie"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-brand-200 bg-white text-brand-800 transition-colors hover:bg-brand-50 focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
          size === "sm" ? "h-9 px-3 py-1.5 text-sm" : "h-9 min-w-[11rem] px-3 py-1.5 text-sm",
        )}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-brand-400 transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-1.5 min-w-full overflow-hidden rounded-lg border border-brand-200 bg-white shadow-lg shadow-brand-900/8">
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={triggerId}
            className="max-h-72 overflow-y-auto overscroll-contain py-1 [scrollbar-width:thin] [scrollbar-color:var(--color-brand-300)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-300 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {SORT_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => pick(opt.value)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50",
                      isSelected
                        ? "bg-brand-50 font-medium text-brand-800"
                        : "text-brand-700",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-brand-600" aria-hidden />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
