import { getModulyConfig } from "@moduly/magazyn-core/config";
import { Palette, Paintbrush, Search, type LucideIcon } from "lucide-react";
import { getModulyConfig() } from "../../magazyn.config";

export type SettingsNavItem = {
	href: string;
	label: string;
	icon: LucideIcon;
};

/** Pozycje menu w sekcji Ustawienia sklepu (sidebar). */
export function buildSettingsNavItems(): SettingsNavItem[] {
	const base = `${getModulyConfig().basePath}/panel/ustawienia`;

	return [
		{ href: `${base}/kolory`, label: "Kolory", icon: Palette },
		{ href: `${base}/motywy`, label: "Motywy magazynu", icon: Paintbrush },
		{ href: `${base}/seo`, label: "SEO", icon: Search },
	];
}

export function isSettingsPath(pathname: string): boolean {
	return pathname.startsWith(`${getModulyConfig().basePath}/panel/ustawienia`);
}
