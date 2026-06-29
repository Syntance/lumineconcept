type DeferredGoogleAnalyticsProps = {
	gaId: string;
	nonce?: string;
};

/**
 * GA4 poza critical path — ładuje się po `window.load` (odpowiednik lazyOnload).
 * Native inline <script> zamiast next/script — unika appendChild w bootstrap chunku.
 *
 * gaId MUSI być trimowany — Vercel ENV często ma trailing \\r\\n, co łamie inline JS.
 */
export function DeferredGoogleAnalytics({ gaId, nonce }: DeferredGoogleAnalyticsProps) {
	const id = gaId.trim();
	if (!id) return null;

	const gaBootstrapScript = `
window.addEventListener('load', function() {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ${JSON.stringify(id)});
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ${JSON.stringify(id)};
  document.head.appendChild(s);
});
`;

	return (
		<script
			id="ga4-deferred"
			nonce={nonce}
			suppressHydrationWarning
			dangerouslySetInnerHTML={{ __html: gaBootstrapScript }}
		/>
	);
}
