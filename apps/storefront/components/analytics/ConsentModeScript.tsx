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

type ConsentModeScriptProps = {
	nonce?: string;
};

/**
 * Google Consent Mode v2 — default denied PRZED załadowaniem GA4.
 *
 * Native inline <script> zamiast next/script beforeInteractive — unika kolejki
 * __next_s i appendChild w bootstrap chunku (SyntaxError w Lighthouse / konsoli).
 */
export function ConsentModeScript({ nonce }: ConsentModeScriptProps) {
	return (
		<script
			id="google-consent-default"
			nonce={nonce}
			suppressHydrationWarning
			dangerouslySetInnerHTML={{ __html: CONSENT_MODE_DEFAULT_SCRIPT }}
		/>
	);
}
