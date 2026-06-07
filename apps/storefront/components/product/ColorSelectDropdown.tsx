"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getColorHex } from "./ProductVariantSelector";

export interface ColorSelectGroup {
  label: string;
  options: Array<{ value: string; label: string }>;
}

interface ColorSelectDropdownProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  groups: ColorSelectGroup[];
  placeholder?: string;
  colorMap?: Record<string, string>;
  className?: string;
  triggerClassName?: string;
}

function ColorSwatchDot({
  hex,
  size = "md",
}: {
  hex: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "size-4" : "size-5";
  if (!hex) {
    return (
      <span
        className={cn(
          "inline-block shrink-0 rounded-full border border-brand-200 bg-brand-100",
          dim,
        )}
        aria-hidden
      />
    );
  }
  if (hex === "transparent") {
    return (
      <span
        className={cn(
          "inline-block shrink-0 rounded-full border border-dashed border-brand-300 bg-[repeating-conic-gradient(#efe8e4_0%_25%,#fff_0%_50%)] bg-[length:6px_6px]",
          dim,
        )}
        aria-hidden
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full border border-brand-200/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]",
        dim,
      )}
      style={{ backgroundColor: hex }}
      aria-hidden
    />
  );
}

export function ColorSelectDropdown({
  id,
  value,
  onChange,
  groups,
  placeholder = "Wybierz opcję",
  colorMap = {},
  className,
  triggerClassName,
}: ColorSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const flatOptions = groups.flatMap((g) => g.options);
  const selected = flatOptions.find((o) => o.value === value);
  const selectedHex =
    value && value !== ""
      ? getColorHex(selected?.label ?? value, colorMap)
      : null;

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
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full min-w-[13.5rem] items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 text-left text-sm shadow-sm transition-[border-color,box-shadow]",
          open
            ? "border-brand-500 ring-2 ring-brand-500/15"
            : "border-brand-200 hover:border-brand-300",
          triggerClassName,
        )}
      >
        {selected ? (
          <>
            <ColorSwatchDot hex={selectedHex} />
            <span className="min-w-0 flex-1 truncate font-medium text-brand-800">
              {selected.label}
            </span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-brand-400">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-brand-400 transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-brand-200 bg-white py-1 shadow-lg shadow-brand-900/8"
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              onClick={() => pick("")}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50",
                value === "" ? "bg-brand-50/80 text-brand-500" : "text-brand-500",
              )}
            >
              <span className="size-5 shrink-0" aria-hidden />
              <span className="flex-1">{placeholder}</span>
            </button>
          </li>

          {groups.map((group) =>
            group.options.length > 0 ? (
              <li key={group.label} role="presentation">
                <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-400">
                  {group.label}
                </p>
                <ul role="group" aria-label={group.label}>
                  {group.options.map((opt) => {
                    const isSelected = value === opt.value;
                    const hex = getColorHex(opt.label, colorMap);
                    return (
                      <li key={opt.value} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => pick(opt.value)}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50",
                            isSelected
                              ? "bg-brand-50 font-medium text-brand-800"
                              : "text-brand-700",
                          )}
                        >
                          <ColorSwatchDot hex={hex} />
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
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
    </div>
  );
}
