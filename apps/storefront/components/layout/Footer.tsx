import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "../marketing/NewsletterForm";

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
      <div className="container mx-auto px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
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

        <div className="mt-12 border-t border-brand-700 pt-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Newsletter
              </h3>
              <p className="mt-2 text-sm text-brand-300">
                Zapisz się i otrzymaj 10% rabatu na pierwsze zamówienie.
              </p>
              <div className="mt-4">
                <NewsletterForm variant="footer" />
              </div>
            </div>
            <p className="text-xs text-brand-400">
              &copy; {new Date().getFullYear()} Lumine Concept. Wszelkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
