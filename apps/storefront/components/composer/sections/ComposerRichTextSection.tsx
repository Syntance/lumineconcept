import { cmsAttr } from "@/lib/cms-preview/attr";
import type { ContentPageId } from "@/lib/content/types";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	heading?: string;
	bodyHtml: string;
};

export async function ComposerRichTextSection({
	pageId,
	sectionId,
	heading,
	bodyHtml,
}: Props) {
	return (
		<div className="w-full" {...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}>
			{heading ? (
				<h2 className="font-display text-3xl tracking-widest text-brand-800">{heading}</h2>
			) : null}
			<div
				className="prose prose-brand mt-4 max-w-none font-gilroy text-brand-800"
				dangerouslySetInnerHTML={{ __html: bodyHtml }}
			/>
		</div>
	);
}
