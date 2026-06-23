import {
	ABOUT_MEDIA_COLUMN_START,
	ABOUT_MISSION_MOBILE_MEDIA_LOWER,
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
		<section aria-labelledby="about-mission-heading" className="relative bg-brand-50">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-[16%] z-0 h-[47%] bg-white"
			/>

			<div
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-[calc(15%-100px)] z-[1] block h-[100px] w-px -translate-x-1/2 bg-brand-800 md:h-[150px]"
			/>

			<div className={cn("relative z-10 mx-auto w-full max-w-7xl pb-16 sm:pb-20 lg:pb-24")}>
				<AboutSectionColumns
					className="px-0 pt-4 sm:pt-6 lg:pt-8"
					mediaOnEnd={false}
					mobileMediaLower={ABOUT_MISSION_MOBILE_MEDIA_LOWER}
					mediaClassName={ABOUT_MEDIA_COLUMN_START}
					textClassName={cn(
						ABOUT_TEXT_GUTTER_LEFT,
						ABOUT_MISSION_TEXT_TOP_OFFSET,
						"max-md:hidden md:flex md:flex-col md:items-start",
					)}
					bodyClassName="text-center md:text-left"
					media={
						<AboutMediaBlock
							labelPosition="above"
							image={
								<AboutArchImage
									src={sections.missionImageUrl}
									alt={sections.missionImageAlt}
								/>
							}
							label={
								sections.missionLabel ? (
									<AboutSectionLabel>{sections.missionLabel}</AboutSectionLabel>
								) : undefined
							}
						/>
					}
					body={
						<>
							<h2 id="about-mission-heading" className="sr-only">
								Nasza misja
							</h2>
							<AboutBodyText paragraphs={sections.missionParagraphs} />
						</>
					}
				/>
			</div>
		</section>
	);
}
