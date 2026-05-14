"use client";

import Link from "next/link";
import { SITE_CONTACT } from "@/lib/site-contact";
import { trackCtaClick } from "@/lib/analytics/events";

interface ContactCalloutPanelProps {
  className?: string;
  /** Po kliknięciu w link formularza (np. zamknięcie menu mobilnego). */
  onNavigate?: () => void;
}

export function ContactCalloutPanel({ className = "", onNavigate }: ContactCalloutPanelProps) {
  return (
    <div className={`space-y-4 text-brand-800 ${className}`.trim()}>
      <p className="text-sm font-medium uppercase tracking-[0.12em] text-brand-600 leading-relaxed">
        {SITE_CONTACT.address}
      </p>
      <p className="text-sm font-medium uppercase tracking-[0.12em] text-brand-600 leading-relaxed">
        {SITE_CONTACT.hours}
      </p>
      <p>
        <a
          href={`mailto:${SITE_CONTACT.email}`}
          onClick={() =>
            trackCtaClick({
              ctaLabel: "contact_email",
              position: "drawer",
              targetUrl: `mailto:${SITE_CONTACT.email}`,
              contactIntent: true,
            })
          }
          className="text-base font-medium text-brand-800 underline underline-offset-2 hover:text-brand-950"
        >
          {SITE_CONTACT.email}
        </a>
      </p>
      <p>
        <Link
          href={SITE_CONTACT.formHref}
          onClick={() => {
            trackCtaClick({
              ctaLabel: "contact_form_link",
              position: "drawer",
              targetUrl: SITE_CONTACT.formHref,
              contactIntent: true,
            });
            onNavigate?.();
          }}
          className="text-base font-medium text-brand-800 underline underline-offset-2 hover:text-brand-950"
        >
          Formularz kontaktowy
        </Link>
      </p>
    </div>
  );
}
