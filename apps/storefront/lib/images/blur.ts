/**
 * Wspólny blur-up placeholder dla zdjęć produktów / kategorii.
 *
 * Zdjęcia produktów przychodzą live z Medusy (R2/CDN), więc nie da się dla nich
 * wygenerować per-image LQIP w buildzie. Zamiast płaskiego `bg-brand-50` — który
 * nagle „przeskakuje" w ostry obraz — używamy lekkiego gradientu w tonach marki
 * jako `blurDataURL`. Jest inline'owany w SSR HTML (zero requestów sieciowych),
 * więc pojawia się natychmiast ze stroną, a `next/image` robi płynny fade do
 * ostrego zdjęcia. Krem zlewa się z jasnymi tłami fotografii produktowej, więc
 * przejście jest niewidoczne — znika efekt „migającego szarego tła".
 */

const brandBlurSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F5F1EC"/><stop offset="100%" stop-color="#ECE4DA"/></linearGradient></defs><rect width="16" height="16" fill="url(#g)"/></svg>`;

function toBase64(value: string): string {
	if (typeof window === "undefined") {
		return Buffer.from(value).toString("base64");
	}
	return window.btoa(value);
}

/** Stały, inline'owany placeholder — bezpieczny dla SSR i klienta (ten sam wynik). */
export const BRAND_BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(brandBlurSvg)}`;
