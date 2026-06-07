"use client";

import { usePathname } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { SettingsSidebarNav } from "./settings-sidebar-nav";
import { isSettingsPath } from "./settings-nav-items";

export function PanelSidebarNav() {
	const pathname = usePathname();

	if (isSettingsPath(pathname)) {
		return <SettingsSidebarNav />;
	}

	return <SidebarNav />;
}
