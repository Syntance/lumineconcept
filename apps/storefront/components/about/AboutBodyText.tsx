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

/** Tekst z CMS — mobile (dzisiaj): scalony akapit; desktop (17 czerwca): linie od xl. */
export function AboutBodyText({ paragraphs, className }: AboutBodyTextProps) {
	const text = flattenAboutBodyParagraphs(paragraphs);
	if (!text) return null;

	const lines = text.split("\n");
	const mobileText = collapseAboutBodyLinesForMobile(text);
	const desktopFlowingText = lines
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.join(" ");

	return (
		<p
			className={cn(
				"min-w-0 text-brand-700",
				"lg:w-full lg:max-w-[min(100%,36rem)] xl:w-full xl:max-w-none",
				ABOUT_BODY_TEXT_CLASS,
				className,
			)}
		>
			<span className="lg:hidden">{mobileText}</span>
			<span className="hidden lg:inline xl:hidden">{desktopFlowingText}</span>
			<span className="hidden xl:contents">
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
