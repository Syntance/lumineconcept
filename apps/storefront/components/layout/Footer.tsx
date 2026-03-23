import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Sklep: [
    { href: "/produkty", label: "Wszystkie produkty" },
    { href: "/salony-beauty", label: "Salony Beauty" },
    { href: "/realizacje", label: "Realizacje" },
    { href: "/konfiguracja", label: "Konfigurator" },
  ],
  Informacje: [
    { href: "/regulamin", label: "Regulamin" },
    { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
    { href: "/dostawa-i-platnosci", label: "Dostawa i płatności" },
    { href: "/zwroty", label: "Zwroty i reklamacje" },
  ],
  Kontakt: [
    { href: "mailto:kontakt@lumineconcept.pl", label: "kontakt@lumineconcept.pl" },
    { href: "/kontakt", label: "Formularz kontaktowy" },
  ],
} as const;

export function Footer() {
  return (
    <footer className="bg-brand-800 text-brand-200" role="contentinfo">
      <div className="container mx-auto px-4 pb-2 pt-8 lg:px-8 lg:pb-3 lg:pt-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <div>
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="Lumine Concept"
                width={140}
                height={32}
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-4 text-sm text-brand-300 max-w-xs">
              Produkty plexi i branding dla salonów beauty. Tworzymy z pasją, dostarczamy z precyzją.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {title}
              </h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-brand-700 pt-3 lg:mt-10 lg:pt-4">
          <p className="text-center text-xs text-brand-400 lg:text-left">
            &copy; {new Date().getFullYear()} Lumine Concept. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </div>
    </footer>
  );
}
