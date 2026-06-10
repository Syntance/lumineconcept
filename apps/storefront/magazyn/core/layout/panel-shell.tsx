import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { magazynConfig } from "../../magazyn.config";
import { getPanelTheme } from "@magazyn/modules/settings/panel-theme-store";
import { panelThemeToStyle } from "@magazyn/modules/settings/panel-theme-vars";
import { getSessionToken } from "../medusa/session";
import { PanelSidebarNav } from "./panel-sidebar-nav";

/**
 * Powłoka panelu: sidebar (branding + nawigacja + wyloguj) i obszar treści.
 * Chroni trasy — brak sesji przekierowuje na ekran logowania.
 *
 * Użyj w `app{basePath}/(panel)/layout.tsx`:
 *   export default function Layout({ children }) {
 *     return <PanelShell>{children}</PanelShell>;
 *   }
 */
export async function PanelShell({ children }: { children: ReactNode }) {
	const token = await getSessionToken();
	if (!token) redirect(magazynConfig.basePath);

	const panelTheme = await getPanelTheme();
	const branding = panelTheme.branding;

	return (
		<div
			data-magazyn-panel
			className="fixed inset-0 w-full overflow-y-auto bg-background text-foreground"
			style={panelThemeToStyle(panelTheme)}
		>
			<div className="mx-auto flex min-h-full w-full max-w-7xl flex-col lg:flex-row">
				<aside className="flex shrink-0 flex-col gap-6 border-b border-border p-5 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-r lg:border-b-0">
					<Link href={`${magazynConfig.basePath}/panel`} className="block">
						<p className="text-[0.65rem] font-medium tracking-[0.25em] text-muted-foreground uppercase">
							{branding.name}
						</p>
						<p className="font-serif text-lg text-foreground">{branding.panelTitle}</p>
					</Link>

					<PanelSidebarNav storefrontUrl={branding.storefrontUrl} />
				</aside>

				<main className="min-w-0 flex-1 p-5 lg:p-8">{children}</main>
			</div>
		</div>
	);
}
