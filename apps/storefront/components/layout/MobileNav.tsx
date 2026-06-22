"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export type MobileNavItem =
  | { kind: "link"; href: string; label: string; emphasized?: boolean }
  | {
      kind: "category";
      label: string;
      href: string;
      sub: ReadonlyArray<{ href: string; label: string }>;
    };

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  items: ReadonlyArray<MobileNavItem>;
}

export function MobileNav({ isOpen, onClose, items }: MobileNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  /**
   * Portal na `document.body`: header ma `backdrop-blur` / `sticky`, co tworzy
   * kontekst pozycjonowania — wtedy `fixed` wewnątrz drzewka headera obejmuje
   * tylko pasek nawigacji zamiast całego viewportu (drawer był przezroczysty
   * i nieczytelny na tle treści). Ten sam wzorzec co `CartDrawer`.
   */
  return createPortal(
    <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu nawigacyjne">
      <div
        className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm"
        style={{ animation: "cartFadeIn 200ms ease-out" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-y-0 left-0 flex h-full w-[86%] max-w-xs flex-col bg-white shadow-2xl"
        style={{ animation: "cartSlideInLeft 300ms ease-out" }}
      >
        <div className="flex items-center justify-between border-b border-brand-100 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <span className="font-display text-[22px] font-bold leading-none text-brand-800">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 p-2 text-brand-800"
            aria-label="Zamknij menu"
          >
            <X className="h-[22px] w-[22px]" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" aria-label="Menu mobilne">
          <ul className="space-y-1">
            {items.map((entry) =>
              entry.kind === "link" ? (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    onClick={onClose}
                    className={`block rounded-lg px-4 py-3 text-[17.6px] text-brand-800 hover:bg-brand-50 hover:text-brand-900 transition-colors ${
                      entry.emphasized ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {entry.label}
                  </Link>
                </li>
              ) : (
                <li key={entry.href} className="rounded-lg">
                  <Link
                    href={entry.href}
                    onClick={onClose}
                    className="block rounded-lg px-4 py-3 text-[17.6px] font-semibold text-brand-800 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                  >
                    {entry.label}
                  </Link>
                  {entry.sub.length > 0 ? (
                    <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-brand-100 pl-2" role="list">
                      {entry.sub.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            onClick={onClose}
                            className="block rounded-lg px-4 py-2.5 text-[16.5px] font-normal text-brand-600 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
    </div>,
    document.body,
  );
}
