/**
 * Biała lista fontów self-hosted (next/font w layout.tsx).
 * Dodanie nowego fontu = zmiana w kodzie (świadoma decyzja dev).
 */
export const FONT_TOKEN_IDS = ["gilroy", "chronicle", "binerka", "system"] as const;

export type FontTokenId = (typeof FONT_TOKEN_IDS)[number];

export const FONT_TOKEN_LABELS: Record<FontTokenId, string> = {
	gilroy: "Gilroy (sans)",
	chronicle: "Chronicle Display (serif)",
	binerka: "Binerka (display akcent)",
	system: "Systemowy",
};

/** Mapowanie tokenu → stack CSS (wyłącznie stałe wartości z kodu). */
export const FONT_CSS_STACKS: Record<FontTokenId, string> = {
	gilroy: "var(--font-gilroy), system-ui, sans-serif",
	chronicle: "var(--font-chronicle), Georgia, serif",
	binerka: "var(--font-binerka), var(--font-chronicle), Georgia, serif",
	system: "system-ui, -apple-system, sans-serif",
};

/** Pliki woff2 do preload — tylko dla aktywnych ról motywu. */
export const FONT_PRELOAD_FILES: Record<
	Exclude<FontTokenId, "system">,
	{ href: string; type: string }
> = {
	gilroy: { href: "/fonts/Gilroy-Regular.woff2", type: "font/woff2" },
	chronicle: { href: "/fonts/ChronicleDisp-Roman.woff2", type: "font/woff2" },
	binerka: { href: "/fonts/Binerka.woff2", type: "font/woff2" },
};

export function fontStackForToken(id: FontTokenId): string {
	return FONT_CSS_STACKS[id];
}

/** Zbiór fontów wymagających preload (bez system). */
export function collectActiveFontFiles(
	body: FontTokenId,
	display: FontTokenId,
	serif: FontTokenId,
): Array<{ href: string; type: string }> {
	const ids = new Set<FontTokenId>([body, display, serif]);
	const files: Array<{ href: string; type: string }> = [];
	for (const id of ids) {
		if (id === "system") continue;
		const file = FONT_PRELOAD_FILES[id];
		if (file && !files.some((f) => f.href === file.href)) {
			files.push(file);
		}
	}
	return files;
}

/** Ścieżki woff2 do `<link rel="preload">` — display + body z tokenów motywu. */
export function collectPreloadPaths(display: FontTokenId, body: FontTokenId): string[] {
	return collectActiveFontFiles(body, display, display).map((f) => f.href);
}

/** Aliasy zgodne z ThemeEditor i index. */
export const FONT_WHITELIST = FONT_TOKEN_IDS;
export const FONT_LABELS = FONT_TOKEN_LABELS;
export const FONT_PRELOAD_PATHS = Object.fromEntries(
	Object.entries(FONT_PRELOAD_FILES).map(([id, f]) => [id, f.href]),
) as Record<Exclude<FontTokenId, "system">, string>;
