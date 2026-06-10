"use client";

import { usePathname } from "next/navigation";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarNav } from "./sidebar-nav";
import { SettingsSidebarNav } from "./settings-sidebar-nav";
import { isSettingsPath } from "./settings-nav-items";

export function PanelSidebarNav({ storefrontUrl }: { storefrontUrl: string }) {
	const pathname = usePathname();

	return (
		<div className="flex flex-col">
			{isSettingsPath(pathname) ? <SettingsSidebarNav /> : <SidebarNav />}
			<SidebarFooter storefrontUrl={storefrontUrl} />
		</div>
	);
}
