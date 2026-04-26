import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Sklep: [
    { href: "/sklep", label: "Wszystkie produkty" },
    { href: "/salony-beauty", label: "Salony Beauty" },
    { href: "/realizacje", label: "Realizacje" },
    { href: "/konfiguracja", label: "Konfigurator" },
  ],
  Informacje: [
    { href: "/regulamin", label: "Regulamin" },
    { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
    { href: "/dostawa-i-platnosci", label: "Dostawa i płatności" },
    { href: "/zwroty", label: "Reklamacje" },
  ],
} as const;

/** Treści pod e-mailem, nad linkiem do formularza — kolumna Kontakt. */
const FOOTER_CONTACT_EXTRA = {
  address: "34-115 Ryczów, ul. Jana Pawła II, nr 93",
  hours: "Godziny otwarcia: pon.–pt.: 9:00–17:00",
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
            <p className="mt-4 text-base text-brand-300 max-w-xs">
              Produkty plexi i branding dla salonów beauty. Tworzymy z pasją, dostarczamy z precyzją.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-base font-semibold uppercase tracking-wider text-white">
                {title}
              </h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-base text-brand-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-base font-semibold uppercase tracking-wider text-white">
              Kontakt
            </h3>
            <ul className="mt-4 space-y-4">
              <li className="list-none">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-300 leading-relaxed">
                  {FOOTER_CONTACT_EXTRA.address}
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-brand-300 leading-relaxed">
                  {FOOTER_CONTACT_EXTRA.hours}
                </p>
              </li>
              <li>
                <a
                  href="mailto:kontakt@lumineconcept.pl"
                  className="text-base text-brand-300 hover:text-white transition-colors"
                >
                  kontakt@lumineconcept.pl
                </a>
              </li>
              <li>
                <Link
                  href="/kontakt"
                  className="text-base text-brand-300 hover:text-white transition-colors"
                >
                  Formularz kontaktowy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-brand-700 pt-3 lg:mt-10 lg:pt-4">
          <div className="flex flex-col items-center gap-2 text-sm text-brand-400 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <p className="text-center lg:text-left">
              &copy; {new Date().getFullYear()} Lumine Concept. Wszelkie prawa zastrzeżone.
            </p>
            <p className="text-center lg:text-right">
              Wykonanie:{" "}
              <a
                href="https://syntance.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-300 underline-offset-2 hover:text-white hover:underline"
              >
                Syntance
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
