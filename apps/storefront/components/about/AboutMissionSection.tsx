import {
	ABOUT_MEDIA_COLUMN_START,
	ABOUT_MISSION_TEXT_TOP_OFFSET,
	ABOUT_TEXT_GUTTER_LEFT,
} from "@/components/about/about-media";
import { AboutBodyText } from "@/components/about/AboutBodyText";
import { AboutArchImage } from "@/components/about/AboutArchImage";
import { AboutMediaBlock } from "@/components/about/AboutMediaBlock";
import { AboutSectionColumns } from "@/components/about/AboutSectionColumns";
import { AboutSectionLabel } from "@/components/about/AboutSectionLabel";
import type { ResolvedAboutSections } from "@/lib/content/about";
import { cn } from "@/lib/utils";

type AboutMissionSectionProps = {
	sections: ResolvedAboutSections;
};

export function AboutMissionSection({ sections }: AboutMissionSectionProps) {
	return (
		<section aria-labelledby="about-mission-heading" className="relative bg-brand-50 max-md:py-12">
			{/* Środkowe 47% — białe (desktop bez zmian). */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-[16%] z-0 h-[47%] bg-white max-lg:hidden"
			/>

			{/* Pionowy separator — środek strony (desktop bez zmian). */}
			<div
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-[calc(15%-100px)] z-[1] hidden h-[150px] w-px -translate-x-1/2 bg-brand-800 lg:block"
			/>

			<div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:pb-20 lg:pb-24 max-md:px-5 max-md:pb-14">
				<AboutSectionColumns
					className="px-0 pt-4 sm:pt-6 lg:pt-8 max-md:gap-6 max-md:pt-0"
					mediaOnEnd={false}
					mobileMediaFirst
					mediaClassName={cn(ABOUT_MEDIA_COLUMN_START, "max-md:flex max-md:justify-center")}
					textClassName={cn(
						ABOUT_TEXT_GUTTER_LEFT,
						ABOUT_MISSION_TEXT_TOP_OFFSET,
						"flex flex-col items-start max-md:items-center",
					)}
					media={
						<AboutMediaBlock
							labelPosition="above"
							image={
								<AboutArchImage
									src={sections.missionImageUrl}
									alt={sections.missionImageAlt}
									className="w-full lg:max-w-none"
								/>
							}
							label={
								sections.missionLabel ? (
									<AboutSectionLabel>{sections.missionLabel}</AboutSectionLabel>
								) : undefined
							}
						/>
					}
					text={
						<>
							<h2 id="about-mission-heading" className="sr-only">
								Nasza misja
							</h2>
							<AboutBodyText
								paragraphs={sections.missionParagraphs}
								className="text-left max-md:text-center"
							/>
						</>
					}
				/>
			</div>
		</section>
	);
}
