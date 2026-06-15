import { getModulyConfig } from "@moduly/magazyn-core/config";
import { getModulyConfig() } from "../../magazyn.config";

/**
 * Formatowanie pieniędzy. W logice pieniądze trzymamy ZAWSZE w najmniejszej
 * jednostce (grosze/cents) jako integer. Format tylko w UI.
 */
export function formatPrice(minorAmount: number, currency = getModulyConfig().currency): string {
	return new Intl.NumberFormat(getModulyConfig().locale, {
		style: "currency",
		currency: currency.toUpperCase(),
	}).format(minorAmount / 100);
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
	return new Intl.DateTimeFormat(getModulyConfig().locale, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}
