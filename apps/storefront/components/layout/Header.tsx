import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { HeroPrefetchBundles } from "@/lib/content/hero-prefetch";
import type { ShopNavLink } from "@/lib/navigation/shop-mobile-nav";
import { HeaderMobileToggle } from "./HeaderMobileToggle";
import { HeaderIcons } from "./HeaderIcons";
import { HeaderLogoLink } from "./HeaderLogoLink";
import { SHOP_HUB_HREF, SHOP_NAV_DROPDOWN } from "./shop-nav";

const NAV_LEFT = [{ href: "/sklep/bablize-z-logo", label: "Tablice z logo" }] as const;

const NAV_RIGHT_LINKS = [{ href: "/o-nas", label: "O nas" }] as const;

const GOTOWE_WZORY_HREF = "/sklep/gotowe-wzory" as const;

function buildHeaderMobileItems(gotoweWzorySub: ShopNavLink[]) {
  return [
    {
      kind: "category" as const,
      label: "Gotowe wzory",
      href: GOTOWE_WZORY_HREF,
      sub: gotoweWzorySub,
    },
    ...NAV_LEFT.map((l) => ({
      kind: "link" as const,
      href: l.href,
      label: l.label,
      emphasized: true,
    })),
    ...NAV_RIGHT_LINKS.map((l) => ({ kind: "link" as const, href: l.href, label: l.label })),
    { kind: "link" as const, href: "/kontakt", label: "Kontakt" },
  ];
}

/** Jedna stała klasy (14px × 1.1) — ta sama w SSR i kliencie; unika hydratacji przy mieszanym cache .next. */
const NAV_LINK_CLASS =
  "inline-flex items-center leading-[1.1] whitespace-nowrap text-[15.4px] font-medium uppercase tracking-[0.15em] text-brand-700 transition-colors hover:text-brand-900";

/**
 * Header = RSC. Interaktywne części są dwoma małymi „island":
 *   - `HeaderMobileToggle` (hamburger + drawer),
 *   - `HeaderIcons` (search + koszyk z badge).
 * Reszta headera (logo, linki desktopowe) renderowana na serwerze —
 * brak niepotrzebnej hydratacji na każdej stronie.
 */
export function Header({
  heroPrefetch,
  gotoweWzoryMobileSub,
}: {
  heroPrefetch: HeroPrefetchBundles;
  gotoweWzoryMobileSub: ShopNavLink[];
}) {
  const headerMobileItems = buildHeaderMobileItems(gotoweWzoryMobileSub);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-100">
      <a href="#main-content" className="skip-to-content">
        Przejdź do treści
      </a>

      <div className="container relative mx-auto flex h-16 items-center px-4 lg:px-8">
        {/* Lewa połowa: od centrum taka sama „luźność” jak po prawej — tekst „dociska” do logo. */}
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:justify-end lg:gap-8 lg:pr-[calc(101.75px+5rem)]">
          <HeaderMobileToggle items={headerMobileItems} />
          <nav className="hidden shrink-0 lg:flex items-center gap-8" aria-label="Nawigacja główna">
            <div className="group relative flex items-center">
              <Link
                href={SHOP_HUB_HREF}
                className={`${NAV_LINK_CLASS} inline-flex items-center gap-1`}
              >
                Sklep
                <ChevronDown
                  className="h-[15.4px] w-[15.4px] shrink-0 opacity-60 transition-transform duration-200 group-hover:rotate-180"
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
                        className="block px-4 py-2.5 text-[14.3px] font-medium uppercase tracking-[0.12em] text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-900"
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

        <HeaderLogoLink heroPrefetch={heroPrefetch} />

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 lg:justify-start lg:gap-8 lg:pl-[calc(101.75px+5rem)]">
          <nav className="hidden shrink-0 lg:flex items-center gap-8" aria-label="Nawigacja dodatkowa">
            {NAV_RIGHT_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
                {link.label}
              </Link>
            ))}
            <Link href="/kontakt" className={NAV_LINK_CLASS}>
              Kontakt
            </Link>
          </nav>
          <HeaderIcons />
        </div>
      </div>
    </header>
  );
}
