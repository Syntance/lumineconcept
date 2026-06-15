import "server-only";
import { adminFetch } from "@moduly/magazyn-core";
import {
	DEFAULT_PANEL_THEME_PRESET_ID,
	panelThemePresetIdSchema,
	resolveActivePresetId,
	themeFromPresetId,
	type PanelTheme,
	type PanelThemePresetId,
	type PanelThemeSelection,
} from "./panel-theme-types";

const METADATA_KEY = "magazyn_panel_theme";

type MedusaStore = { id: string; metadata?: Record<string, unknown> | null };

async function getStore(): Promise<MedusaStore> {
	const data = await adminFetch<{ stores: MedusaStore[] }>(
		"/admin/stores?limit=1&fields=id,metadata",
	);
	const store = data.stores[0];
	if (!store) throw new Error("Nie znaleziono sklepu w Medusa.");
	return store;
}

function readMetadataRaw(store: MedusaStore): unknown {
	return store.metadata?.[METADATA_KEY];
}

export async function getActivePanelThemePresetId(): Promise<PanelThemePresetId> {
	try {
		const store = await getStore();
		return resolveActivePresetId(readMetadataRaw(store));
	} catch {
		return DEFAULT_PANEL_THEME_PRESET_ID;
	}
}

export async function getPanelTheme(): Promise<PanelTheme> {
	const presetId = await getActivePanelThemePresetId();
	return themeFromPresetId(presetId);
}

export async function savePanelThemePreset(presetId: PanelThemePresetId): Promise<PanelTheme> {
	const parsed = panelThemePresetIdSchema.safeParse(presetId);
	if (!parsed.success) {
		throw new Error("Nieprawidłowy motyw panelu.");
	}

	const selection: PanelThemeSelection = { presetId: parsed.data };
	const store = await getStore();

	await adminFetch(`/admin/stores/${store.id}`, {
		method: "POST",
		body: JSON.stringify({
			metadata: {
				...(store.metadata ?? {}),
				[METADATA_KEY]: JSON.stringify(selection),
			},
		}),
	});

	return themeFromPresetId(parsed.data);
}

export async function resetPanelTheme(): Promise<PanelTheme> {
	return savePanelThemePreset(DEFAULT_PANEL_THEME_PRESET_ID);
}
