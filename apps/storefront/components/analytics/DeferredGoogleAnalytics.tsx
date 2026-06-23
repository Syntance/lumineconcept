import Script from "next/script";

type DeferredGoogleAnalyticsProps = {
  gaId: string;
};

/**
 * GA4 poza critical path — `lazyOnload` (po `window.load`), nie `afterInteractive`.
 * Consent Mode v2: domyślne `denied` ustawia `ConsentModeScript` (beforeInteractive);
 * kolejka `dataLayer` jest przetwarzana po załadowaniu gtag.js.
 */
export function DeferredGoogleAnalytics({ gaId }: DeferredGoogleAnalyticsProps) {
  const gaBootstrapScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');
var s = document.createElement('script');
s.async = true;
s.src = 'https://www.googletagmanager.com/gtag/js?id=${gaId}';
document.head.appendChild(s);
`;

  return (
    <Script
      id="ga4-deferred"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{ __html: gaBootstrapScript }}
    />
  );
}
