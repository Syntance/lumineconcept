import Link from "next/link";
import { cmsAttr } from "@/lib/cms-preview/attr";
import type { ContentPageId } from "@/lib/content/types";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	heading?: string;
	intro?: string;
};

export async function ComposerContactFormSection({ pageId, sectionId, heading, intro }: Props) {
	return (
		<div
			className="flex flex-col items-center gap-4 py-10 text-center"
			{...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}
		>
			{heading ? <h2 className="font-display text-2xl text-brand-800">{heading}</h2> : null}
			{intro ? <p className="max-w-lg text-brand-700">{intro}</p> : null}
			<Link
				href="/kontakt"
				className="inline-flex rounded border border-brand-300 px-6 py-2.5 text-sm font-medium uppercase tracking-wider text-brand-800 hover:bg-brand-50"
			>
				Przejdź do formularza
			</Link>
		</div>
	);
}
