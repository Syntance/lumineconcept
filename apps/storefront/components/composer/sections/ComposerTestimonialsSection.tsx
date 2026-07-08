import { cmsAttr } from "@/lib/cms-preview/attr";
import type { ContentPageId, Testimonial } from "@/lib/content/types";
import { pickTestimonials } from "@/lib/content/cms-wiring";

type Props = {
	pageId: ContentPageId;
	sectionId: string;
	items: Testimonial[];
};

export async function ComposerTestimonialsSection({ pageId, sectionId, items }: Props) {
	const display = pickTestimonials(items, 6);
	if (!display.length) return null;

	return (
		<div
			className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
			{...(await cmsAttr(`page.${pageId}.sections.${sectionId}`))}
		>
			{display.map((t) => (
				<blockquote key={t.id} className="rounded-xl bg-white p-6 text-left shadow-sm">
					<p className="text-base italic leading-relaxed text-brand-800">&ldquo;{t.quote}&rdquo;</p>
					<footer className="mt-3 text-sm text-brand-500">
						— {t.name}
						{t.company ? `, ${t.company}` : ""}
					</footer>
				</blockquote>
			))}
		</div>
	);
}
