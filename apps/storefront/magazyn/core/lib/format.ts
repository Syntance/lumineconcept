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
