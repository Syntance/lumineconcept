"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Search, ShoppingBag, Menu, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { MobileNav } from "./MobileNav";
import { AnnouncementBar } from "./AnnouncementBar";
import { SearchModal } from "../search/SearchModal";
import { CartDrawer } from "../cart/CartDrawer";

const NAV_LEFT = [
  { href: "/produkty", label: "Sklep" },
  { href: "/salony-beauty", label: "Salony beauty" },
] as const;

const NAV_RIGHT = [
  { href: "/dlaczego-lumine", label: "O nas" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

const ALL_LINKS = [...NAV_LEFT, ...NAV_RIGHT];

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

        <div className="container mx-auto grid h-16 grid-cols-3 items-center px-4 lg:px-8">
          {/* Left: hamburger (mobile) / nav (desktop) */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 text-brand-700"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Otwórz menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav className="hidden lg:flex items-center gap-8" aria-label="Nawigacja główna">
              {NAV_LEFT.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand-700 hover:text-brand-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: logo */}
          <div className="flex justify-center">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="Lumine Concept"
                width={140}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Right: nav (desktop) + icons */}
          <div className="flex items-center justify-end gap-8">
            <nav className="hidden lg:flex items-center gap-8" aria-label="Nawigacja dodatkowa">
              {NAV_RIGHT.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand-700 hover:text-brand-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-brand-600 hover:text-brand-900 transition-colors"
                aria-label="Szukaj"
              >
                <Search className="h-4 w-4" />
              </button>
              <Link
                href="/konto"
                className="hidden sm:block p-2 text-brand-600 hover:text-brand-900 transition-colors"
                aria-label="Moje konto"
              >
                <User className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 text-brand-600 hover:text-brand-900 transition-colors"
                aria-label={`Koszyk (${itemCount} produktów)`}
              >
                <ShoppingBag className="h-4 w-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          links={[...ALL_LINKS]}
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
