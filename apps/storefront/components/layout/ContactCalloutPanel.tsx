"use client";

import Link from "next/link";
import { SITE_CONTACT } from "@/lib/site-contact";
import { trackCtaClick } from "@/lib/analytics/events";
import { ContactFormMini } from "@/components/contact/ContactFormMini";

interface ContactCalloutPanelProps {
  className?: string;
  /** Po kliknięciu w link / zamknięciu (np. menu mobilne). */
  onNavigate?: () => void;
  mode?: "info" | "form";
  onOpenForm?: () => void;
  onBackToInfo?: () => void;
}

export function ContactCalloutPanel({
  className = "",
  onNavigate,
  mode = "info",
  onOpenForm,
  onBackToInfo,
}: ContactCalloutPanelProps) {
  if (mode === "form") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={onBackToInfo}
          className="mb-3 text-xs font-medium uppercase tracking-wide text-brand-600 hover:text-brand-900"
        >
          ← Wróć do danych kontaktowych
        </button>
        <ContactFormMini onSuccess={onNavigate} />
      </div>
    );
  }

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
        <button
          type="button"
          onClick={() => {
            trackCtaClick({
              ctaLabel: "contact_form_callout",
              position: "header",
              contactIntent: true,
            });
            onOpenForm?.();
          }}
          className="text-base font-medium text-brand-800 underline underline-offset-2 hover:text-brand-950"
        >
          Formularz kontaktowy
        </button>
      </p>
      <p>
        <Link
          href="/#kontakt"
          onClick={() => {
            trackCtaClick({
              ctaLabel: "contact_section_link",
              position: "header",
              targetUrl: "/#kontakt",
              contactIntent: true,
            });
            onNavigate?.();
          }}
          className="text-sm text-brand-600 underline underline-offset-2 hover:text-brand-900"
        >
          Pełny formularz na stronie głównej
        </Link>
      </p>
    </div>
  );
}
