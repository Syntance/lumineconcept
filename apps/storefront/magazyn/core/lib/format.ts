import { magazynConfig } from "../../magazyn.config";

/**
 * Formatowanie pieniędzy. W logice pieniądze trzymamy ZAWSZE w najmniejszej
 * jednostce (grosze/cents) jako integer. Format tylko w UI.
 */
export function formatPrice(minorAmount: number, currency = magazynConfig.currency): string {
	return new Intl.NumberFormat(magazynConfig.locale, {
		style: "currency",
		currency: currency.toUpperCase(),
	}).format(minorAmount / 100);
}

/** Skrócona etykieta osi wykresu — wejście w groszach (integer). */
export function formatChartAxisPrice(
	minorAmount: number,
	currency = magazynConfig.currency,
): string {
	const pln = minorAmount / 100;
	if (pln >= 10_000) {
		return `${new Intl.NumberFormat(magazynConfig.locale, { maximumFractionDigits: 1 }).format(pln / 1000)} tys.`;
	}
	return new Intl.NumberFormat(magazynConfig.locale, {
		style: "currency",
		currency: currency.toUpperCase(),
		maximumFractionDigits: minorAmount % 100 === 0 ? 0 : 2,
	}).format(pln);
}

/**
 * Medusa v2 (store cart + admin order fields) zwraca PLN jako decimal (1 = 1 zł).
 * Magazyn / maile operują na groszach (integer).
 */
export function toMinorUnitsFromDecimal(amount: number | null | undefined): number {
	if (amount == null || !Number.isFinite(amount)) return 0;
	return Math.round(amount * 100);
}

export function formatDateTime(iso: string): string {
	if (!iso) return "—";
	return new Intl.DateTimeFormat(magazynConfig.locale, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}
