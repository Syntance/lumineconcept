import { Palette, Paintbrush, type LucideIcon } from "lucide-react";
import { magazynConfig } from "../../magazyn.config";

export type SettingsNavItem = {
	href: string;
	label: string;
	icon: LucideIcon;
};

/** Pozycje menu w sekcji Ustawienia sklepu (sidebar). */
export function buildSettingsNavItems(): SettingsNavItem[] {
	const base = `${magazynConfig.basePath}/panel/ustawienia`;

	return [
		{ href: `${base}/kolory`, label: "Kolory", icon: Palette },
		{ href: `${base}/motywy`, label: "Motywy magazynu", icon: Paintbrush },
	];
}

export function isSettingsPath(pathname: string): boolean {
	return pathname.startsWith(`${magazynConfig.basePath}/panel/ustawienia`);
}
