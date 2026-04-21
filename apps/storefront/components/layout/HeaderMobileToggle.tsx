"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileNav } from "./MobileNav";

interface HeaderMobileToggleProps {
  links: ReadonlyArray<{ href: string; label: string }>;
}

/** Mały island: hamburger + mobile drawer. Reszta headera pozostaje RSC. */
export function HeaderMobileToggle({ links }: HeaderMobileToggleProps) {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="lg:hidden p-2 -ml-2 text-brand-700"
        onClick={() => setOpen(true)}
        aria-label="Otwórz menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <MobileNav
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        links={links.map((l) => ({ href: l.href, label: l.label }))}
      />
    </>
  );
}
