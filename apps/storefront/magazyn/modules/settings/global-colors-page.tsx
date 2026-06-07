import { loadAdmin } from "@magazyn/core/auth/load";
import { listGlobalConfigOptions } from "@magazyn/modules/products/store";
import { GlobalColorsManager } from "./global-colors-manager";
import { SettingsSubnav } from "./settings-subnav";

export const dynamic = "force-dynamic";

export default async function GlobalColorsPage() {
	const options = await loadAdmin(listGlobalConfigOptions);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Ustawienia sklepu</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Globalna konfiguracja domyślna dla wszystkich produktów.
				</p>
			</header>

			<SettingsSubnav />

			<div>
				<h2 className="text-lg font-medium text-foreground">Kolory globalne produktów</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Paleta bazowa konfiguratora — każdy nowy produkt startuje z pełnym zestawem tych kolorów.
				</p>
			</div>

			<GlobalColorsManager initialOptions={options} />
		</div>
	);
}
