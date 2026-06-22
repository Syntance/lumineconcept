import { BarChart3, LayoutGrid, Mail, Package, FileText, Settings, ShoppingBag, Tags, Ticket, type LucideIcon } from "lucide-react";
import { magazynConfig } from "../../magazyn.config";
import type { ModulesToggle } from "../config/types";

export type NavItem = {
	href: string;
	label: string;
	icon: LucideIcon;
	exact: boolean;
};

const MODULE_NAV: Record<keyof ModulesToggle, { segment: string; label: string; icon: LucideIcon }> = {
	orders: { segment: "zamowienia", label: "Zamówienia", icon: ShoppingBag },
	products: { segment: "produkty", label: "Produkty", icon: Package },
	categories: { segment: "kategorie", label: "Kategorie", icon: Tags },
	promotions: { segment: "kody-promocyjne", label: "Kody promocyjne", icon: Ticket },
	emails: { segment: "maile", label: "E-maile", icon: Mail },
	settings: { segment: "ustawienia", label: "Ustawienia sklepu", icon: Settings },
	content: { segment: "cms", label: "CMS", icon: FileText },
};

const ORDER: Array<keyof ModulesToggle> = ["orders", "products", "categories", "promotions", "content", "emails", "settings"];

/** Buduje listę linków nawigacji z włączonych modułów (magazyn.config.ts). */
export function buildNavItems(): NavItem[] {
	const base = magazynConfig.basePath;
	const items: NavItem[] = [
		{ href: `${base}/panel`, label: "Przegląd", icon: LayoutGrid, exact: true },
		{ href: `${base}/panel/statystyki`, label: "Statystyki", icon: BarChart3, exact: false },
	];

	for (const key of ORDER) {
		if (!magazynConfig.modules[key]) continue;
		const def = MODULE_NAV[key];
		items.push({ href: `${base}/panel/${def.segment}`, label: def.label, icon: def.icon, exact: false });
	}

	return items;
}
