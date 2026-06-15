import { loadAdmin } from "@moduly/magazyn-core";
import { getActivePanelThemePresetId } from "./panel-theme-store";
import { PanelThemePicker } from "./panel-theme-picker";

export const dynamic = "force-dynamic";

export default async function MagazynThemePage() {
	const activePresetId = await loadAdmin(getActivePanelThemePresetId);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Motywy magazynu</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Gotowe palety interfejsu panelu — wybierz jedną, bez ręcznej edycji kolorów.
				</p>
			</header>

			<PanelThemePicker activePresetId={activePresetId} />
		</div>
	);
}
