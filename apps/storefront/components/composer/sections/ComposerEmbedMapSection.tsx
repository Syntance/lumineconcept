import { cmsAttr } from "@/lib/cms-preview/attr";
import type { ContentPageId } from "@/lib/content/types";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	heading?: string;
	embedUrl: string;
};

export async function ComposerEmbedMapSection({ pageId, sectionId, heading, embedUrl }: Props) {
	return (
		<div {...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}>
			{heading ? (
				<h2 className="mb-4 text-center font-display text-2xl tracking-widest text-brand-800">
					{heading}
				</h2>
			) : null}
			<div className="relative aspect-video w-full overflow-hidden rounded-xl bg-brand-100">
				<iframe
					title={heading ?? "Mapa"}
					src={embedUrl}
					className="absolute inset-0 h-full w-full border-0"
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
				/>
			</div>
		</div>
	);
}
