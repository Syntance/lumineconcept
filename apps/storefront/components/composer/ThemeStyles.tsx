import { getThemeTokens } from "@/lib/content/theme";
import { renderThemeCss } from "@/lib/composer/theme";

/**
 * RSC: wstrzykuje zmienne CSS motywu z Store.metadata.themeTokens.
 * Kilka set bajtów w <head> — bez JS, bez klas generowanych w runtime.
 * Wartości domyślne = brand Lumine z globals.css gdy metadata puste.
 */
export async function ThemeStyles() {
	const tokens = await getThemeTokens();
	const css = renderThemeCss(tokens);
	return <style id="lumine-theme-tokens">{css}</style>;
}
