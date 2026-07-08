import { z } from "zod";
import type { CSSProperties } from "react";

/** Tokeny układu sekcji (Etap 3) — wyłącznie enum, bez surowych klas z bazy. */
export const layoutAlignSchema = z.enum(["left", "center", "right"]);
export const layoutSizeSchema = z.enum(["sm", "md", "lg"]);
export const layoutColumnsSchema = z.enum(["1", "2", "3", "4"]);
export const layoutSpacingSchema = z.enum(["sm", "md", "lg"]);
export const layoutBackgroundSchema = z.enum(["none", "muted", "brand", "image"]);
export const layoutVariantSchema = z.enum(["light", "dark"]);

export type LayoutAlign = z.infer<typeof layoutAlignSchema>;
export type LayoutSize = z.infer<typeof layoutSizeSchema>;
export type LayoutColumns = z.infer<typeof layoutColumnsSchema>;
export type LayoutSpacing = z.infer<typeof layoutSpacingSchema>;
export type LayoutBackground = z.infer<typeof layoutBackgroundSchema>;
export type LayoutVariant = z.infer<typeof layoutVariantSchema>;

export const sectionLayoutSchema = z.object({
	align: layoutAlignSchema.default("center"),
	size: layoutSizeSchema.default("md"),
	columns: layoutColumnsSchema.default("1"),
	spacing: layoutSpacingSchema.default("md"),
	background: layoutBackgroundSchema.default("none"),
	backgroundImageUrl: z.string().max(2048).optional(),
	fullWidth: z.boolean().default(false),
	variant: layoutVariantSchema.default("light"),
	mobile: z
		.object({
			align: layoutAlignSchema.optional(),
			size: layoutSizeSchema.optional(),
			columns: layoutColumnsSchema.optional(),
			spacing: layoutSpacingSchema.optional(),
		})
		.optional(),
});

export type SectionLayout = z.infer<typeof sectionLayoutSchema>;

export const DEFAULT_SECTION_LAYOUT: SectionLayout = sectionLayoutSchema.parse({});

/**
 * Biała lista klas Tailwind — pełne nazwy (widoczne dla kompilatora).
 * Token spoza enum → fallback do default.
 */
export const LAYOUT_CLASSES = {
	align: {
		left: "items-start text-left",
		center: "items-center text-center",
		right: "items-end text-right",
	},
	size: {
		sm: "max-w-3xl",
		md: "max-w-5xl",
		lg: "max-w-7xl",
	},
	columns: {
		"1": "grid-cols-1",
		"2": "grid-cols-1 md:grid-cols-2",
		"3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
		"4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
	},
	spacing: {
		sm: "gap-4 py-8 md:py-10",
		md: "gap-6 py-12 md:py-16",
		lg: "gap-8 py-16 md:py-24",
	},
	background: {
		none: "bg-transparent",
		muted: "bg-muted",
		brand: "bg-brand-50",
		image: "bg-cover bg-center",
	},
	variant: {
		light: "text-brand-800",
		dark: "bg-brand-800 text-white",
	},
	fullWidth: {
		true: "w-full max-w-none px-0",
		false: "mx-auto w-full px-4 sm:px-6 lg:px-8",
	},
} as const;

function pickEnum<T extends string>(
	value: unknown,
	allowed: readonly T[],
	fallback: T,
): T {
	return typeof value === "string" && (allowed as readonly string[]).includes(value)
		? (value as T)
		: fallback;
}

/** Bezpieczne mapowanie layoutu → klasy (nigdy surowa wartość z bazy). */
export function resolveLayoutClasses(layout: SectionLayout | undefined): string {
	const l = layout ?? DEFAULT_SECTION_LAYOUT;
	const align = pickEnum(l.align, layoutAlignSchema.options, "center");
	const size = pickEnum(l.size, layoutSizeSchema.options, "md");
	const columns = pickEnum(l.columns, layoutColumnsSchema.options, "1");
	const spacing = pickEnum(l.spacing, layoutSpacingSchema.options, "md");
	const background = pickEnum(l.background, layoutBackgroundSchema.options, "none");
	const variant = pickEnum(l.variant, layoutVariantSchema.options, "light");
	const fullWidth = l.fullWidth === true;

	const mobile = l.mobile ?? {};
	const mAlign = mobile.align
		? pickEnum(mobile.align, layoutAlignSchema.options, align)
		: align;
	const mColumns = mobile.columns
		? pickEnum(mobile.columns, layoutColumnsSchema.options, columns)
		: columns;

	const parts = [
		LAYOUT_CLASSES.fullWidth[fullWidth ? "true" : "false"],
		LAYOUT_CLASSES.size[size],
		LAYOUT_CLASSES.spacing[spacing],
		LAYOUT_CLASSES.background[background],
		LAYOUT_CLASSES.variant[variant],
		`flex flex-col ${LAYOUT_CLASSES.align[align]}`,
	];

	if (columns !== "1") {
		parts.push(`grid ${LAYOUT_CLASSES.columns[columns]}`);
	}

	if (mColumns !== columns && mColumns !== "1") {
		const mobileGrid = LAYOUT_CLASSES.columns[mColumns].replace(/ md:[^\s]+/g, "").replace(/ lg:[^\s]+/g, "");
		parts.push(`max-lg:grid ${mobileGrid.replace(/^grid-cols-/, "max-lg:grid-cols-")}`);
	}

	if (mAlign !== align) {
		parts.push(`max-lg:${LAYOUT_CLASSES.align[mAlign].replace(/ /g, " max-lg:")}`);
	}

	return parts.join(" ");
}

export function layoutInlineStyle(layout: SectionLayout | undefined): CSSProperties | undefined {
	if (layout?.background === "image" && layout.backgroundImageUrl) {
		return { ["--section-bg" as string]: `url(${layout.backgroundImageUrl})` };
	}
	return undefined;
}
