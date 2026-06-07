import { LayoutGrid, Mail, Package, Settings, ShoppingBag, Tags, type LucideIcon } from "lucide-react";
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
	emails: { segment: "maile", label: "Maile", icon: Mail },
	settings: { segment: "ustawienia", label: "Ustawienia sklepu", icon: Settings },
};

const ORDER: Array<keyof ModulesToggle> = ["orders", "products", "categories", "emails", "settings"];

/** Buduje listę linków nawigacji z włączonych modułów (magazyn.config.ts). */
export function buildNavItems(): NavItem[] {
	const base = magazynConfig.basePath;
	const items: NavItem[] = [
		{ href: `${base}/panel`, label: "Przegląd", icon: LayoutGrid, exact: true },
	];

	for (const key of ORDER) {
		if (!magazynConfig.modules[key]) continue;
		const def = MODULE_NAV[key];
		items.push({ href: `${base}/panel/${def.segment}`, label: def.label, icon: def.icon, exact: false });
	}

	return items;
}
