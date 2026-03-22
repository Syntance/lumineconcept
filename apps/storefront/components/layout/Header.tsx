"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, ShoppingBag, Menu, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { MobileNav } from "./MobileNav";
import { AnnouncementBar } from "./AnnouncementBar";
import { SearchModal } from "../search/SearchModal";
import { CartDrawer } from "../cart/CartDrawer";

const NAV_LINKS = [
  { href: "/produkty", label: "Produkty" },
  { href: "/salony-beauty", label: "Salony Beauty" },
  { href: "/realizacje", label: "Realizacje" },
  { href: "/konfiguracja", label: "Konfigurator" },
  { href: "/blog", label: "Blog" },
] as const;

export function Header() {
  const { itemCount, openCart } = useCart();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-100">
        <a href="#main-content" className="skip-to-content">
          Przejdź do treści
        </a>
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Otwórz menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/"
              className="font-display text-xl font-bold tracking-wide text-brand-900"
            >
              LUMINE
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Nawigacja główna">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-700 hover:text-brand-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-brand-700 hover:text-brand-900 transition-colors"
              aria-label="Szukaj"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/konto"
              className="hidden sm:block p-2 text-brand-700 hover:text-brand-900 transition-colors"
              aria-label="Moje konto"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 text-brand-700 hover:text-brand-900 transition-colors"
              aria-label={`Koszyk (${itemCount} produktów)`}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          links={[...NAV_LINKS]}
        />
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setSearchOpen(false)}
        />
        <CartDrawer />
      </header>
    </>
  );
}
