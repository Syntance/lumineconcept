import type { ReactNode } from "react";

import {
	ABOUT_DESKTOP_GRID_SHELL,
	ABOUT_MOBILE_BODY_BETWEEN_COLUMNS,
	ABOUT_MOBILE_MEDIA_LOWER,
	ABOUT_MEDIA_LABEL_INSET_X,
	ABOUT_MEDIA_LABEL_OVERLAP_BELOW,
	ABOUT_INTRO_MOBILE_MEDIA_FRAME,
	ABOUT_INTRO_SECTION_MOBILE_FRAME,
	ABOUT_MOBILE_MEDIA_FRAME_LEFT,
	ABOUT_MOBILE_MEDIA_FRAME_RIGHT,
	ABOUT_PAGE_CONTENT_MAX,
	ABOUT_PAGE_GUTTER,
	ABOUT_SECTION_MOBILE_BODY_ROW,
	ABOUT_SECTION_SAFE,
} from "@/components/about/about-media";
import { cn } from "@/lib/utils";

/** Mobile — układ jak sekcja 1: zdjęcie + body pod spodem. */
export type AboutMobileStackedLayout = "intro" | "media-start" | "media-end";

type AboutSectionColumnsProps = {
	heading?: ReactNode;
	body: ReactNode;
	media: ReactNode;
	/** Pełny blok mediów na desktop (gdy `media` to samo zdjęcie na mobile). */
	desktopMedia?: ReactNode;
	className?: string;
	textClassName?: string;
	mediaClassName?: string;
	bodyClassName?: string;
	/** Nadpisanie pozycji bloku tekstu na mobile (intro). */
	mobileBodyWrapperClassName?: string;
	/** Podpis pod zdjęciem — osobny wiersz na mobile (intro). */
	mediaCaption?: ReactNode;
	/** Mobile: dół nagłówka w linii z dołem zdjęcia (nad podpisem). */
	mobileHeadingAlignImageBottom?: boolean;
	/** Mobile: układ z sekcji 1 — intro | zdjęcie lewo | zdjęcie prawo. */
	mobileStackedLayout?: AboutMobileStackedLayout;
	/** Nadpisanie domyślnego offsetu zdjęcia na mobile (np. intro wyżej). */
	mobileMediaLower?: string;
	/** true = tekst lewa kolumna, zdjęcie prawa (domyślnie). false = zdjęcie lewa, tekst prawa. */
	mediaOnEnd?: boolean;
	/** Mobile: tekst w kolumnie obok zdjęcia (misja), nie pod spodem. */
	mobileBodyBesideMedia?: boolean;
	/** Mobile: klasy układu obok zdjęcia (misja — flex + gap 10px). */
	mobileGridClassName?: string;
	/** Mobile: klasy kolumny ze zdjęciem przy układzie flex (misja). */
	mobileMediaColClassName?: string;
	/** Mobile: klasy kolumny z tekstem przy układzie flex (misja). */
	mobileTextColClassName?: string;
};

type AboutSectionGridShellProps = {
	className?: string;
	gridClassName: string;
	children: ReactNode;
};

/** Mobile/tablet — gutter 50px + max-w-7xl wewnątrz. */
function AboutMobileGridShell({
	className,
	gridClassName,
	children,
}: AboutSectionGridShellProps) {
	return (
		<div className={cn("w-full min-w-0 lg:hidden", ABOUT_PAGE_GUTTER, ABOUT_SECTION_SAFE, className)}>
			<div className={cn(ABOUT_PAGE_CONTENT_MAX, gridClassName)}>{children}</div>
		</div>
	);
}

export function AboutSectionColumns({
	heading,
	body,
	media,
	desktopMedia,
	className,
	textClassName,
	mediaClassName,
	bodyClassName,
	mobileBodyWrapperClassName,
	mediaCaption,
	mobileHeadingAlignImageBottom = false,
	mobileStackedLayout,
	mobileMediaLower = ABOUT_MOBILE_MEDIA_LOWER,
	mediaOnEnd = true,
	mobileBodyBesideMedia = false,
	mobileGridClassName,
	mobileMediaColClassName,
	mobileTextColClassName,
}: AboutSectionColumnsProps) {
	const textOrder = mediaOnEnd ? "order-1" : "order-2";
	const mediaOrder = mediaOnEnd ? "order-2" : "order-1";
	const resolvedDesktopMedia = desktopMedia ?? media;
	const resolvedMobileLayout: AboutMobileStackedLayout | null = mobileHeadingAlignImageBottom
		? "intro"
		: (mobileStackedLayout ?? null);

	const renderMobileBodyRow = (rowStart: string) => (
		<div
			className={cn(
				"col-span-2",
				rowStart,
				ABOUT_SECTION_MOBILE_BODY_ROW,
				mobileBodyWrapperClassName ?? "w-full text-center",
				bodyClassName,
			)}
		>
			{body}
		</div>
	);

	const mobileMediaCell = (columnClass: string, frameClass: string) => (
		<div
			className={cn(
				columnClass,
				"flex min-h-0 w-full flex-col justify-start",
				mobileMediaLower,
				mediaClassName,
			)}
		>
			<div className={frameClass}>{media}</div>
		</div>
	);

	/** Desktop (lg+) — siatka z commitów 17–18 czerwca: px-4, max-w-7xl, prosty 2-kolumnowy grid. */
	const desktopGrid = (
		<div className={cn(ABOUT_DESKTOP_GRID_SHELL, className)}>
			<div className={cn("min-w-0", textOrder, textClassName)}>
				{heading}
				<div className={cn(bodyClassName)}>{body}</div>
			</div>

			<div className={cn("min-w-0 max-w-full overflow-x-clip lg:overflow-visible", mediaOrder, mediaClassName)}>
				{resolvedDesktopMedia}
			</div>
		</div>
	);

	const useMissionBesideFlex =
		mobileBodyBesideMedia && Boolean(mobileGridClassName?.includes("flex"));

	const defaultMobileGrid = useMissionBesideFlex ? (
		<AboutMobileGridShell className={className} gridClassName={mobileGridClassName ?? ""}>
			<div
				className={cn(
					mediaOrder,
					mobileMediaLower,
					mediaClassName,
					mobileMediaColClassName,
				)}
			>
				{media}
			</div>

			<div className={cn(textOrder, textClassName, mobileTextColClassName)}>
				{heading}
				<div className={cn("block w-full min-w-0", bodyClassName)}>{body}</div>
			</div>
		</AboutMobileGridShell>
	) : (
		<AboutMobileGridShell
			className={className}
			gridClassName={cn(
				"grid items-start",
				mobileGridClassName ?? "grid-cols-2 gap-3",
				resolvedMobileLayout ? "hidden" : "grid",
			)}
		>
			<div className={cn("min-w-0", textOrder, textClassName)}>
				{heading}
				<div className={cn(mobileBodyBesideMedia ? "block" : "hidden", bodyClassName)}>{body}</div>
			</div>

			<div className={cn("min-w-0", mediaOrder, mobileMediaLower, mediaClassName)}>{media}</div>

			{mobileBodyBesideMedia ? null : (
				<div className={cn("min-w-0", ABOUT_MOBILE_BODY_BETWEEN_COLUMNS, bodyClassName)}>{body}</div>
			)}
		</AboutMobileGridShell>
	);

	if (!resolvedMobileLayout) {
		return (
			<>
				{defaultMobileGrid}
				{desktopGrid}
			</>
		);
	}

	if (resolvedMobileLayout === "media-start") {
		return (
			<>
				<AboutMobileGridShell
					className={className}
					gridClassName="grid grid-cols-2 grid-rows-[auto_auto] items-stretch gap-x-3 gap-y-0"
				>
					{mobileMediaCell("col-start-1 row-start-1", ABOUT_MOBILE_MEDIA_FRAME_LEFT)}
					{heading ? (
						<div
							className={cn(
								"col-start-2 row-start-1 flex min-h-0 w-full flex-col items-start justify-end self-stretch",
								textClassName,
							)}
						>
							{heading}
						</div>
					) : (
						<div className="col-start-2 row-start-1" aria-hidden />
					)}
					{renderMobileBodyRow("row-start-2")}
				</AboutMobileGridShell>
				{desktopGrid}
			</>
		);
	}

	if (resolvedMobileLayout === "media-end") {
		return (
			<>
				<AboutMobileGridShell
					className={className}
					gridClassName="grid grid-cols-2 grid-rows-[auto_auto] items-stretch gap-x-3 gap-y-0"
				>
					{heading ? (
						<div
							className={cn(
								"col-start-1 row-start-1 flex min-h-0 w-full flex-col items-end justify-center self-stretch",
								textClassName,
							)}
						>
							{heading}
						</div>
					) : (
						<div className="col-start-1 row-start-1" aria-hidden />
					)}
					{mobileMediaCell("col-start-2 row-start-1", ABOUT_MOBILE_MEDIA_FRAME_RIGHT)}
					{renderMobileBodyRow("row-start-2")}
				</AboutMobileGridShell>
				{desktopGrid}
			</>
		);
	}

	return (
		<>
			<AboutMobileGridShell
				className={className}
				gridClassName="grid grid-cols-2 grid-rows-[auto_auto] items-start gap-x-3 gap-y-0"
			>
				<div
					className={cn(
						"col-start-1 row-start-1 flex min-h-0 w-full flex-col items-start justify-end self-stretch",
						textClassName,
					)}
				>
					{heading}
				</div>

				<div
					className={cn(
						"col-start-2 row-start-1 flex min-h-0 w-full flex-col items-end justify-start",
						mobileMediaLower,
						mediaClassName,
					)}
				>
					<div className={ABOUT_INTRO_SECTION_MOBILE_FRAME}>
						<div className="w-full min-w-0 [&_img]:block">{media}</div>
						{mediaCaption ? (
							<div
								className={cn(
									ABOUT_MEDIA_LABEL_OVERLAP_BELOW,
									"w-full shrink-0 max-lg:hidden",
									ABOUT_MEDIA_LABEL_INSET_X,
								)}
							>
								{mediaCaption}
							</div>
						) : null}
					</div>
				</div>

				{renderMobileBodyRow("row-start-2")}
			</AboutMobileGridShell>

			{desktopGrid}
		</>
	);
}
