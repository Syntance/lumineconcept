"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect } from "react";

export type MobileNavItem =
  | { kind: "link"; href: string; label: string }
  | {
      kind: "shop";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu nawigacyjne">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-brand-100">
          <span className="font-display text-xl font-bold text-brand-800">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-brand-800"
            aria-label="Zamknij menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4" aria-label="Menu mobilne">
          <ul className="space-y-1">
            {items.map((entry) =>
              entry.kind === "link" ? (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    onClick={onClose}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-brand-800 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                  >
                    {entry.label}
                  </Link>
                </li>
              ) : (
                <li key={entry.href} className="rounded-lg">
                  <Link
                    href={entry.href}
                    onClick={onClose}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-brand-800 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                  >
                    {entry.label}
                  </Link>
                  <ul className="mt-0.5 space-y-0.5 border-l border-brand-100 pl-2 ml-4" role="list">
                    {entry.sub.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          onClick={onClose}
                          className="block rounded-lg px-4 py-2.5 text-[15px] text-brand-600 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}
