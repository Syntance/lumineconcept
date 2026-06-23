import {
	collapseAboutBodyLinesForMobile,
	flattenAboutBodyParagraphs,
} from "@/lib/content/about-text";
import { ABOUT_BODY_TEXT_CLASS } from "@/components/about/about-typography";
import { cn } from "@/lib/utils";

type AboutBodyTextProps = {
	paragraphs: string[];
	className?: string;
};

/** Tekst z CMS — desktop: Enter = osobna linia; mobile: normalny akapit. */
export function AboutBodyText({ paragraphs, className }: AboutBodyTextProps) {
	const text = flattenAboutBodyParagraphs(paragraphs);
	if (!text) return null;

	const lines = text.split("\n");
	const mobileText = collapseAboutBodyLinesForMobile(text);

	return (
		<p
			className={cn(
				"min-w-0 text-brand-700",
				ABOUT_BODY_TEXT_CLASS,
				className,
			)}
		>
			<span className="md:hidden">{mobileText}</span>
			<span className="hidden md:contents">
				{lines.map((line, index) => (
					<span
						key={`${index}-${line.slice(0, 12)}`}
						className="block whitespace-nowrap"
					>
						{line}
					</span>
				))}
			</span>
		</p>
	);
}
