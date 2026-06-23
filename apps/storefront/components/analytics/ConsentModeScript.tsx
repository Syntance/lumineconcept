import Script from "next/script";

const CONSENT_MODE_DEFAULT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
`;

/**
 * Google Consent Mode v2 — default denied PRZED załadowaniem GA4.
 */
export function ConsentModeScript() {
  return (
    <Script
      id="google-consent-default"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: CONSENT_MODE_DEFAULT_SCRIPT }}
    />
  );
}
