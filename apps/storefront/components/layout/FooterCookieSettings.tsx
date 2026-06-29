"use client";

import { openConsentBanner } from "@/lib/consent/consent";

export function FooterCookieSettings() {
  return (
    <button
      type="button"
      onClick={() => openConsentBanner()}
      className="text-base text-on-brand-800 hover:text-white transition-colors underline-offset-2 hover:underline"
    >
      Ustawienia cookies
    </button>
  );
}
