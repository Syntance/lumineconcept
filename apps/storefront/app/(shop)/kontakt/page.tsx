import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, Instagram, Mail, MapPin } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ContactForm } from "@/components/contact/ContactForm";
import { SITE_CONTACT } from "@/lib/site-contact";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Skontaktuj się z Lumine Concept — formularz, e-mail, Instagram. Pracownia w Ryczowie, godziny otwarcia pon.–pt. 9:00–17:00.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${SITE_URL}/kontakt`,
  },
};

function ContactDetail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">{label}</p>
        <div className="mt-1 text-base text-brand-800">{children}</div>
      </div>
    </li>
  );
}

export default function KontaktPage() {
  return (
    <div className="border-b border-brand-100 bg-brand-50/30">
      <div className="container mx-auto px-4 py-8 pb-16 sm:py-12">
        <Breadcrumbs items={[{ label: "Strona główna", href: "/" }, { label: "Kontakt" }]} />

        <div className="mx-auto max-w-6xl">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-[0.2em] text-brand-500">
            Lumine Concept
          </p>
          <h1 className="mb-4 text-center font-display text-3xl font-bold tracking-wide text-brand-800 sm:text-4xl">
            Kontakt
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-pretty text-center text-brand-700">
            Pytania o produkty, wycena lub współpraca — odezwiemy się e-mailem. Możesz też napisać bezpośrednio lub
            wysłać DM na Instagramie.
          </p>

          <div className="grid gap-10 lg:grid-cols-[1fr_minmax(20rem,26rem)] lg:gap-12">
            <section id="formularz" aria-labelledby="kontakt-form-heading">
              <h2
                id="kontakt-form-heading"
                className="mb-6 font-display text-xl tracking-wide text-brand-800 sm:text-2xl"
              >
                Formularz kontaktowy
              </h2>
              <div className="rounded-lg border border-brand-200 bg-white p-5 shadow-sm sm:p-6">
                <ContactForm />
              </div>
            </section>

            <aside className="min-w-0 lg:pt-1" aria-labelledby="kontakt-details-heading">
              <h2
                id="kontakt-details-heading"
                className="mb-5 font-display text-xl tracking-wide text-brand-800 sm:text-2xl"
              >
                Dane kontaktowe
              </h2>
              <div className="w-full rounded-lg border border-brand-200 bg-white p-5 shadow-sm sm:p-7">
                <ul className="space-y-5">
                  <ContactDetail icon={MapPin} label="Miejscowość">
                    {SITE_CONTACT.address}
                  </ContactDetail>
                  <ContactDetail icon={Clock} label="Godziny otwarcia">
                    {SITE_CONTACT.hours.replace(/^Godziny otwarcia:\s*/i, "")}
                  </ContactDetail>
                  <ContactDetail icon={Mail} label="E-mail">
                    <a
                      href={`mailto:${SITE_CONTACT.email}`}
                      className="font-medium text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
                    >
                      {SITE_CONTACT.email}
                    </a>
                  </ContactDetail>
                  <ContactDetail icon={Instagram} label="Instagram">
                    <a
                      href={SITE_CONTACT.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
                    >
                      {SITE_CONTACT.instagramHandle}
                    </a>
                    <p className="mt-2 text-sm text-brand-600">
                      <Link
                        href={SITE_CONTACT.instagramDmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-2 hover:underline"
                      >
                        Wyślij wiadomość na IG
                      </Link>
                    </p>
                  </ContactDetail>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
