import Link from "next/link";
import Image from "next/image";
import { getSiteSettings } from "@/lib/content";
import { resolveFooterText, resolveSocialLinks } from "@/lib/content/cms-wiring";
import { SITE_CONTACT } from "@/lib/site-contact";
import { FooterCookieSettings } from "@/components/layout/FooterCookieSettings";
import { FooterCreditLink, FooterSocialLinks } from "@/components/layout/FooterSocialLinks";

const FOOTER_LINKS = {
  Sklep: [
    { href: "/sklep", label: "Wszystkie produkty" },
    { href: "/sklep/bablize-z-logo", label: "Tablice z logo" },
    { href: "/sklep/certyfikaty", label: "Certyfikaty" },
    { href: "/salony-beauty", label: "Salony Beauty" },
  ],
  Informacje: [
    { href: "/kontakt", label: "Kontakt" },
    { href: "/regulamin", label: "Regulamin" },
    { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
    { href: "/dostawa-i-platnosci", label: "Dostawa i płatności" },
    { href: "/zwroty", label: "Reklamacje" },
    { href: "/deklaracja-dostepnosci", label: "Deklaracja dostępności" },
  ],
} as const;

export async function Footer() {
  const settings = await getSiteSettings();
  const copyright = resolveFooterText(settings);
  const social = resolveSocialLinks(settings);

  return (
    <footer className="relative z-10 bg-brand-800 text-brand-200" role="contentinfo">
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
            <p className="mt-4 max-w-xs text-base text-on-brand-800">
              Produkty plexi i branding dla salonów beauty. Tworzymy z pasją, dostarczamy z precyzją.
            </p>
            {(social.instagram || social.facebook || social.tiktok) && (
              <FooterSocialLinks social={social} />
            )}
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-base font-normal uppercase tracking-wider text-white">
                {title}
              </h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-base text-on-brand-800 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-base font-normal uppercase tracking-wider text-white">
              Kontakt
            </h3>
            <ul className="mt-4 space-y-4">
              <li className="list-none">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-on-brand-800 leading-relaxed">
                  {SITE_CONTACT.address}
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-on-brand-800 leading-relaxed">
                  {SITE_CONTACT.hours}
                </p>
              </li>
              <li>
                <a
                  href={`mailto:${SITE_CONTACT.email}`}
                  className="text-base text-on-brand-800 hover:text-white transition-colors"
                >
                  {SITE_CONTACT.email}
                </a>
              </li>
              <li>
                <Link
                  href={SITE_CONTACT.formHref}
                  className="text-base text-on-brand-800 hover:text-white transition-colors"
                >
                  Formularz kontaktowy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-brand-700 pt-3 lg:mt-10 lg:pt-4">
          <div className="mb-3 flex justify-center lg:justify-start">
            <FooterCookieSettings />
          </div>
          <div className="flex flex-col items-center gap-2 text-sm text-on-brand-800 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <p className="text-center lg:text-left">{copyright}</p>
            <p className="text-center lg:text-right">
              Wdrożenie strony: <FooterCreditLink />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
