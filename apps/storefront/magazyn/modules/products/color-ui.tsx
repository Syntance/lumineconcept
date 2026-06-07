import type { ColorCategoryId } from "./color-categories";
import type { ConfigOption } from "./store";

export function ColorSwatch({ hex }: { hex: string | null }) {
	if (!hex || hex === "transparent") {
		return (
			<span className="inline-flex size-4 items-center justify-center rounded-full border border-dashed border-border">
				<span className="text-[7px] text-muted-foreground">∅</span>
			</span>
		);
	}
	return (
		<span
			className="inline-block size-4 rounded-full border border-border"
			style={{ backgroundColor: hex }}
			aria-hidden
		/>
	);
}

export function colorsInCategory(options: ConfigOption[], category: ColorCategoryId): ConfigOption[] {
	return options.filter(
		(o) => o.type === "color" && (o.color_category ?? "standard") === category,
	);
}

export function sortConfigOptions(options: ConfigOption[]): ConfigOption[] {
	return [...options].sort((a, b) => {
		if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
		return a.name.localeCompare(b.name, "pl");
	});
}
