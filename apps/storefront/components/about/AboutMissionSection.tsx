import {
	ABOUT_MEDIA_COLUMN_START,
	ABOUT_MISSION_MOBILE_MEDIA_LOWER,
	ABOUT_MISSION_TEXT_TOP_OFFSET,
	ABOUT_SECTION_SAFE,
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
		<section
			aria-labelledby="about-mission-heading"
			className={cn("relative bg-brand-50", ABOUT_SECTION_SAFE, "max-lg:overflow-x-clip")}
		>
			{/* Biały pas misji — tylko desktop (commit 17 czerwca). */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-[16%] z-0 h-[47%] max-lg:hidden bg-white"
			/>

			<div
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-[calc(15%-100px)] z-[1] hidden h-[150px] w-px -translate-x-1/2 bg-brand-800 lg:block"
			/>

			<div className="relative z-10 w-full pb-16 sm:pb-20 lg:mx-auto lg:max-w-7xl lg:px-4 lg:pb-24">
				<AboutSectionColumns
					className="pt-8"
					mediaOnEnd={false}
					mobileBodyBesideMedia
					mobileMediaLower={ABOUT_MISSION_MOBILE_MEDIA_LOWER}
					mediaClassName={cn(
						ABOUT_MEDIA_COLUMN_START,
						"max-lg:flex max-lg:justify-center",
					)}
					textClassName={cn(
						ABOUT_TEXT_GUTTER_LEFT,
						ABOUT_MISSION_TEXT_TOP_OFFSET,
						"max-lg:flex max-lg:flex-col max-lg:items-start",
						"lg:flex lg:flex-col lg:items-start",
					)}
					bodyClassName="max-lg:text-center lg:text-left"
					media={
						<AboutMediaBlock
							labelPosition="above"
							image={
								<AboutArchImage
									src={sections.missionImageUrl}
									alt={sections.missionImageAlt}
									className="lg:max-w-none"
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
