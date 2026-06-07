import type { CSSProperties } from "react";
import type { PanelTheme } from "./panel-theme-types";

/** Mapuje zapisany motyw na zmienne CSS używane przez shadcn / magazyn. */
export function panelThemeToStyle(theme: PanelTheme): CSSProperties {
	const { colors, radiusPx } = theme;
	const radiusRem = `${radiusPx / 16}rem`;

	const vars: Record<string, string> = {
		"--background": colors.background,
		"--foreground": colors.foreground,
		"--card": colors.card,
		"--card-foreground": colors.cardForeground,
		"--muted": colors.muted,
		"--muted-foreground": colors.mutedForeground,
		"--primary": colors.primary,
		"--primary-foreground": colors.primaryForeground,
		"--border": colors.border,
		"--input": colors.input,
		"--ring": colors.ring,
		"--destructive": colors.destructive,
		"--radius": radiusRem,
		"--radius-lg": radiusRem,
		"--color-background": colors.background,
		"--color-foreground": colors.foreground,
		"--color-card": colors.card,
		"--color-card-foreground": colors.cardForeground,
		"--color-muted": colors.muted,
		"--color-muted-foreground": colors.mutedForeground,
		"--color-primary": colors.primary,
		"--color-primary-foreground": colors.primaryForeground,
		"--color-border": colors.border,
		"--color-input": colors.input,
		"--color-ring": colors.ring,
		"--color-destructive": colors.destructive,
	};

	return vars as CSSProperties;
}
