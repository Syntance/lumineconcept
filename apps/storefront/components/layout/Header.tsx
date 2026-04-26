import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { HeaderMobileToggle } from "./HeaderMobileToggle";
import { HeaderIcons } from "./HeaderIcons";
import { SHOP_HUB_HREF, SHOP_NAV_DROPDOWN } from "./shop-nav";

const NAV_LEFT = [{ href: "/salony-beauty", label: "Salony beauty" }] as const;

const NAV_RIGHT = [
  { href: "/dlaczego-lumine", label: "O nas" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

/** Menu mobilne: Sklep z podlinkami + pozostałe linki. */
const HEADER_MOBILE_ITEMS = [
  {
    kind: "shop" as const,
    label: "Sklep",
    href: SHOP_HUB_HREF,
    sub: SHOP_NAV_DROPDOWN,
  },
  ...NAV_LEFT.map((l) => ({ kind: "link" as const, href: l.href, label: l.label })),
  ...NAV_RIGHT.map((l) => ({ kind: "link" as const, href: l.href, label: l.label })),
];

/** Jedna stała klasy (jawny 14px = text-sm) — ta sama w SSR i kliencie; unika hydratacji przy mieszanym cache .next. */
const NAV_LINK_CLASS =
  "text-[14px] font-medium uppercase tracking-[0.15em] text-brand-700 hover:text-brand-900 transition-colors";

/**
 * Header = RSC. Interaktywne części są dwoma małymi „island":
 *   - `HeaderMobileToggle` (hamburger + drawer),
 *   - `HeaderIcons` (search + konto + koszyk z badge).
 * Reszta headera (logo, linki desktopowe) renderowana na serwerze —
 * brak niepotrzebnej hydratacji na każdej stronie.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-100">
      <a href="#main-content" className="skip-to-content">
        Przejdź do treści
      </a>

      <div className="container mx-auto grid h-16 grid-cols-3 items-center px-4 lg:px-8">
        <div className="flex items-center gap-8">
          <HeaderMobileToggle items={HEADER_MOBILE_ITEMS} />
          <nav className="hidden lg:flex items-center gap-8" aria-label="Nawigacja główna">
            <div className="group relative flex items-center">
              <Link
                href={SHOP_HUB_HREF}
                className={`${NAV_LINK_CLASS} inline-flex items-center gap-1`}
              >
                Sklep
                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 group-hover:rotate-180"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
              <div
                className="pointer-events-none invisible absolute left-0 top-full z-50 min-w-[13.5rem] pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
                role="presentation"
              >
                <ul
                  className="rounded-md border border-brand-100 bg-white py-2 shadow-lg"
                  role="list"
                >
                  {SHOP_NAV_DROPDOWN.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.12em] text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-900"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {NAV_LEFT.map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Lumine Concept"
              width={168}
              height={38}
              className="h-[38px] w-auto"
              priority
            />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-8">
          <nav className="hidden lg:flex items-center gap-8" aria-label="Nawigacja dodatkowa">
            {NAV_RIGHT.map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </Link>
            ))}
          </nav>
          <HeaderIcons />
        </div>
      </div>
    </header>
  );
}
