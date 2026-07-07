import Link from "next/link";
import { cmsAttr } from "@/lib/cms-preview/attr";
import type { ContentPageId } from "@/lib/content/types";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	heading?: string;
	subheading?: string;
	ctaLabel?: string;
	ctaHref?: string;
	desktopBackgroundUrl?: string;
};

export async function ComposerCtaSection({
	pageId,
	sectionId,
	heading,
	subheading,
	ctaLabel,
	ctaHref,
}: Props) {
	return (
		<div
			className="flex flex-col items-center gap-4 py-12 text-center"
			{...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}
		>
			{heading ? (
				<h2 className="font-display text-3xl tracking-widest text-brand-800 lg:text-4xl">{heading}</h2>
			) : null}
			{subheading ? (
				<p className="max-w-xl font-gilroy text-lg text-brand-700">{subheading}</p>
			) : null}
			{ctaLabel && ctaHref ? (
				<Link
					href={ctaHref}
					className="inline-flex items-center justify-center rounded border border-brand-300 px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-800 transition-colors hover:bg-brand-50"
				>
					{ctaLabel}
				</Link>
			) : null}
		</div>
	);
}
