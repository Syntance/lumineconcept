/** Dozwolone ikony paska bocznego (po schowaniu popupu). */
export const POPUP_BANNER_TAB_ICON_IDS = [
	"mail",
	"gift",
	"tag",
	"percent",
	"sparkles",
	"bell",
	"megaphone",
	"star",
	"heart",
	"ticket",
] as const;

export type PopupBannerTabIcon = (typeof POPUP_BANNER_TAB_ICON_IDS)[number];

export const POPUP_BANNER_TAB_ICON_OPTIONS: ReadonlyArray<{
	id: PopupBannerTabIcon;
	label: string;
}> = [
	{ id: "mail", label: "Koperta" },
	{ id: "gift", label: "Prezent" },
	{ id: "tag", label: "Etykieta" },
	{ id: "percent", label: "Procent" },
	{ id: "sparkles", label: "Iskry" },
	{ id: "bell", label: "Dzwonek" },
	{ id: "megaphone", label: "Megafon" },
	{ id: "star", label: "Gwiazdka" },
	{ id: "heart", label: "Serce" },
	{ id: "ticket", label: "Bilet" },
];

export const DEFAULT_POPUP_TAB_LABEL = "Oferta";
export const DEFAULT_POPUP_TAB_ICON: PopupBannerTabIcon = "mail";

export function isPopupBannerTabIcon(value: unknown): value is PopupBannerTabIcon {
	return (
		typeof value === "string" &&
		(POPUP_BANNER_TAB_ICON_IDS as readonly string[]).includes(value)
	);
}

export function resolvePopupTabIcon(value: unknown): PopupBannerTabIcon {
	return isPopupBannerTabIcon(value) ? value : DEFAULT_POPUP_TAB_ICON;
}

export function resolvePopupTabLabel(value: unknown): string {
	if (typeof value !== "string") return DEFAULT_POPUP_TAB_LABEL;
	const trimmed = value.trim();
	return trimmed || DEFAULT_POPUP_TAB_LABEL;
}
