import type { FaqItem } from "@moduly/types";
import { pickPageFaq } from "@/lib/content/cms-wiring";

type Props = {
	faq: FaqItem[] | undefined;
};

export function PageFaqSection({ faq }: Props) {
	const items = pickPageFaq(faq);
	if (items.length === 0) return null;

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "FAQPage",
						mainEntity: items.map((f) => ({
							"@type": "Question",
							name: f.question,
							acceptedAnswer: { "@type": "Answer", text: f.answer },
						})),
					}),
				}}
			/>
			<section className="border-t border-brand-100 bg-white">
				<div className="container mx-auto max-w-3xl px-4 py-10 lg:py-14">
					<h2 className="mb-8 text-center font-display text-2xl tracking-widest text-brand-800 lg:text-3xl">
						Często zadawane pytania
					</h2>
					<div className="space-y-4">
						{items.map((item) => (
							<details key={item.id} className="group rounded-xl bg-brand-50 p-5 shadow-sm">
								<summary className="flex cursor-pointer items-center justify-between text-base font-medium text-brand-800">
									{item.question}
									<span className="ml-2 text-brand-400 transition-transform group-open:rotate-45">
										+
									</span>
								</summary>
								<p className="mt-3 text-base leading-relaxed text-brand-600">{item.answer}</p>
							</details>
						))}
					</div>
				</div>
			</section>
		</>
	);
}
