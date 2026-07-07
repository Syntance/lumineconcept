import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "@magazyn/magazyn.config";
import { getContentBundle } from "./content-store";
import { CmsSettingsClient } from "./cms-settings-client";

export const dynamic = "force-dynamic";

export default async function CmsPage() {
	const bundle = await loadAdmin(getContentBundle);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">CMS</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Treści i zdjęcia sekcji witryny — per podstrona i globalnie.
				</p>
			</header>
			<CmsSettingsClient
				siteSettings={bundle.siteSettings}
				pageContent={bundle.pageContent}
				globalContent={bundle.globalContent}
				themeTokens={bundle.themeTokens}
				pages={magazynConfig.content.pages}
				activeTab="global"
			/>
		</div>
	);
}
