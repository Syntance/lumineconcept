import { collectPreloadPaths } from "@/lib/composer/theme";
import { getThemeTokens } from "@/lib/content/theme";

/**
 * Preload tylko fontów aktywnych w tokenach motywu (display + body).
 * Pozostałe pliki woff2 nie trafiają na krytyczną ścieżkę LCP.
 */
export async function ThemeFontPreloads() {
	const tokens = await getThemeTokens();
	const paths = collectPreloadPaths(tokens.fonts.display, tokens.fonts.body);

	return (
		<>
			{paths.map((href) => (
				<link
					key={href}
					rel="preload"
					href={href}
					as="font"
					type="font/woff2"
					crossOrigin="anonymous"
				/>
			))}
		</>
	);
}
