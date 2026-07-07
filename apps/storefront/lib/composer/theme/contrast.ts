/**
 * Kalkulator kontrastu WCAG 2.x — współczynnik luminancji względnej.
 * Wejście: string OKLCH (parsowany do sRGB liniowego).
 */

const OKLCH_PATTERN =
	/^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i;

type OklchParsed = { l: number; c: number; h: number; alpha: number };

function parseOklch(value: string): OklchParsed | null {
	const m = OKLCH_PATTERN.exec(value.trim());
	if (!m) return null;
	const lRaw = m[1];
	if (lRaw === undefined) return null;
	let l = Number(lRaw);
	if (lRaw.includes("%")) {
		l = l / 100;
	} else if (l > 1) {
		l = l / 100;
	}
	const c = Number(m[2]);
	const h = Number(m[3]);
	let alpha = 1;
	if (m[4]) {
		const a = m[4].trim();
		alpha = a.endsWith("%") ? Number(a) / 100 : Number(a);
	}
	return { l, c, h, alpha };
}

/** OKLCH → sRGB 0–1 (uproszczony algorytm CSS Color Level 4). */
function oklchToRgb(oklch: OklchParsed): [number, number, number] {
	const hRad = (oklch.h * Math.PI) / 180;
	const a = oklch.c * Math.cos(hRad);
	const b = oklch.c * Math.sin(hRad);

	const l_ = oklch.l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = oklch.l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = oklch.l - 0.0894841775 * a - 1.291485548 * b;

	const l3 = l_ ** 3;
	const m3 = m_ ** 3;
	const s3 = s_ ** 3;

	let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
	let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
	let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

	const clamp = (x: number) => Math.min(1, Math.max(0, x));
	r = clamp(r);
	g = clamp(g);
	bl = clamp(bl);

	if (oklch.alpha < 1) {
		// Kompozycja na białym tle dla półprzezroczystych kolorów
		r = r * oklch.alpha + (1 - oklch.alpha);
		g = g * oklch.alpha + (1 - oklch.alpha);
		bl = bl * oklch.alpha + (1 - oklch.alpha);
	}

	return [r, g, bl];
}

function relativeLuminance(r: number, g: number, b: number): number {
	const toLinear = (c: number) =>
		c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	const rl = toLinear(r);
	const gl = toLinear(g);
	const bl = toLinear(b);
	return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Współczynnik kontrastu WCAG między dwoma kolorami OKLCH.
 * Zwraca null gdy parsowanie się nie powiedzie.
 */
export function contrastRatio(foreground: string, background: string): number | null {
	const fg = parseOklch(foreground);
	const bg = parseOklch(background);
	if (!fg || !bg) return null;

	const [fr, fgG, fb] = oklchToRgb(fg);
	const [br, bgG, bb] = oklchToRgb(bg);

	const l1 = relativeLuminance(fr, fgG, fb);
	const l2 = relativeLuminance(br, bgG, bb);

	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);

	return (lighter + 0.05) / (darker + 0.05);
}

/** Czy para spełnia WCAG AA dla normalnego tekstu (≥ 4.5:1). */
export function meetsWcagAaNormal(foreground: string, background: string): boolean {
	const ratio = contrastRatio(foreground, background);
	if (ratio === null) return true;
	return ratio >= 4.5;
}

export function formatContrastRatio(ratio: number | null): string {
	if (ratio === null) return "—";
	return `${ratio.toFixed(2)}:1`;
}

/** Próg WCAG AA dla normalnego tekstu. */
export const WCAG_AA_NORMAL = 4.5;
