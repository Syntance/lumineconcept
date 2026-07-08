import "server-only";
import { cache } from "react";
import { fetchStoreMetadataBlob } from "@/lib/content/admin-read";
import { MAGAZYN_THEME_TOKENS_KEY } from "@/lib/content/metadata-keys";
import { parseThemeTokens } from "@/lib/composer/theme/parse";
import type { ThemeTokens } from "@/lib/composer/theme/schema";

/**
 * Tokeny motywu z Store.metadata — jeden odczyt na render (cache).
 * W draftMode admin-read zwraca świeże dane → zmiana widoczna od razu w podglądzie.
 */
export const getThemeTokens = cache(async (): Promise<ThemeTokens> => {
	const blob = await fetchStoreMetadataBlob();
	if (!blob?.themeTokens) {
		return parseThemeTokens(null);
	}
	return parseThemeTokens(blob.themeTokens);
});

export { MAGAZYN_THEME_TOKENS_KEY };
