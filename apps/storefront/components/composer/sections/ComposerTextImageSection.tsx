import Image from "next/image";
import { cmsAttr } from "@/lib/cms-preview/attr";
import type { ContentPageId } from "@/lib/content/types";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	heading?: string;
	body?: string;
	imageUrl?: string;
	imageAlt?: string;
	imagePosition?: "left" | "right";
};

export async function ComposerTextImageSection({
	pageId,
	sectionId,
	heading,
	body,
	imageUrl,
	imageAlt,
	imagePosition = "right",
}: Props) {
	const imageFirst = imagePosition === "left";

	return (
		<div
			className="grid items-center gap-8 lg:grid-cols-2"
			{...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}
		>
			{imageFirst && imageUrl ? (
				<ImageBlock pageId={pageId} sectionId={sectionId} url={imageUrl} alt={imageAlt} />
			) : null}
			<div>
				{heading ? (
					<h2 className="font-display text-3xl tracking-widest text-brand-800">{heading}</h2>
				) : null}
				{body ? <p className="mt-4 font-gilroy text-base leading-relaxed text-brand-800">{body}</p> : null}
			</div>
			{!imageFirst && imageUrl ? (
				<ImageBlock pageId={pageId} sectionId={sectionId} url={imageUrl} alt={imageAlt} />
			) : null}
		</div>
	);
}

async function ImageBlock({
	pageId,
	sectionId,
	url,
	alt,
}: {
	pageId: ContentPageId;
	sectionId: string;
	url: string;
	alt?: string;
}) {
	return (
		<div
			className="relative aspect-4/3 w-full overflow-hidden bg-brand-50"
			{...(await cmsAttr(`page.${pageId}.sections.${sectionId}.imageUrl`, { inline: "image" }))}
		>
			<Image
				src={url}
				alt={alt ?? ""}
				fill
				className="object-cover"
				sizes="(max-width: 1024px) 100vw, 50vw"
				unoptimized={isCmsImageUnoptimized(url)}
			/>
		</div>
	);
}
