import type { CSSProperties, ReactNode } from "react";
import { cmsAttr } from "@/lib/cms-preview/attr";
import type { SectionLayout } from "@/lib/composer/sections/layout";
import { layoutInlineStyle, resolveLayoutClasses } from "@/lib/composer/sections/layout";

type Props = {
	pageId: string;
	sectionId: string;
	layout?: SectionLayout;
	children: ReactNode;
	className?: string;
};

/** Opakowanie sekcji — klasy z białej listy (Etap 3), bez inline CSS z bazy. */
export async function SectionLayoutShell({
	pageId,
	sectionId,
	layout,
	children,
	className = "",
}: Props) {
	const layoutClasses = resolveLayoutClasses(layout);
	const style = layoutInlineStyle(layout);

	return (
		<div
			className={`${layoutClasses} ${className}`.trim()}
			style={style as CSSProperties}
			{...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}
		>
			{children}
		</div>
	);
}
