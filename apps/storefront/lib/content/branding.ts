import type { BrandingCtaContent } from "./types";
import { resolveCmsAssetUrl } from "./asset-url";

export function resolveBrandingCta(branding?: BrandingCtaContent): {
	desktopBackgroundUrl?: string;
} {
	if (!branding?.desktopBackgroundUrl?.trim()) return {};
	return {
		desktopBackgroundUrl: resolveCmsAssetUrl(branding.desktopBackgroundUrl.trim()),
	};
}
