import Link from "next/link";
import Image from "next/image";
import { HeaderMobileToggle } from "./HeaderMobileToggle";
import { HeaderIcons } from "./HeaderIcons";

const NAV_LEFT = [
  { href: "/sklep", label: "Sklep" },
  { href: "/salony-beauty", label: "Salony beauty" },
] as const;

const NAV_RIGHT = [
  { href: "/dlaczego-lumine", label: "O nas" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

const ALL_LINKS = [...NAV_LEFT, ...NAV_RIGHT];

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
          <HeaderMobileToggle links={ALL_LINKS} />
          <nav className="hidden lg:flex items-center gap-8" aria-label="Nawigacja główna">
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
