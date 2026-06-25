import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "@magazyn/magazyn.config";
import { getContentBundle } from "./content-store";
import { CmsNav } from "./cms-nav";
import { CmsRedeployButton } from "./cms-redeploy-button";
import { PopupBannersEditor } from "./popup-banners-editor";

export const dynamic = "force-dynamic";

export default async function PopupBannersPage() {
	const bundle = await loadAdmin(getContentBundle);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Banery popup</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Callout popup na środku ekranu — treść, link, zdjęcie i targetowanie podstron.
				</p>
			</header>
			<div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
				<CmsNav pages={magazynConfig.content.pages} />
				<div className="min-w-0 flex-1 flex flex-col gap-4">
					<CmsRedeployButton />
					<PopupBannersEditor globalContent={bundle.globalContent} />
				</div>
			</div>
		</div>
	);
}
