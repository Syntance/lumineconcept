"use client";

import { useEffect } from "react";
import Script from "next/script";

export function CookieConsent() {
  useEffect(() => {
    const handleConsentUpdate = () => {
      const event = new CustomEvent("cookieyes_consent_update");
      document.dispatchEvent(event);
    };

    document.addEventListener("cookieyes_consent_update", handleConsentUpdate);
    return () => {
      document.removeEventListener("cookieyes_consent_update", handleConsentUpdate);
    };
  }, []);

  return (
    <Script
      id="cookieyes"
      src="https://cdn-cookieyes.com/client_data/YOUR_COOKIEYES_ID/script.js"
      strategy="beforeInteractive"
    />
  );
}
