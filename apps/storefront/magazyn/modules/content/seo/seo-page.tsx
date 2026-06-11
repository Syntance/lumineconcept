import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "@magazyn/magazyn.config";
import { getSeoSettingsBundle } from "./seo-store";
import { SeoSettingsClient } from "./seo-settings-client";

export const dynamic = "force-dynamic";

export default async function SeoSettingsPage() {
	const bundle = await loadAdmin(getSeoSettingsBundle);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">SEO</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Meta tagi globalne i dla poszczególnych podstron sklepu.
				</p>
			</header>

			<SeoSettingsClient
				siteSettings={bundle.siteSettings}
				pageSeo={bundle.pageSeo}
				pages={magazynConfig.content.pages}
				activeTab="global"
			/>
		</div>
	);
}
