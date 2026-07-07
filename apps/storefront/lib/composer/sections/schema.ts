import { z } from "zod";
import { sectionLayoutSchema } from "./layout";
import { sanitizePlainText, sanitizeRichTextHtml } from "./sanitize";

const urlOptional = z.string().max(2048).optional();
const urlRequired = z.string().min(1).max(2048);

export const SECTION_TYPE_IDS = [
	"hero",
	"textImage",
	"richText",
	"gallery",
	"faq",
	"testimonials",
	"cta",
	"categoryTiles",
	"bestsellers",
	"divider",
	"contactForm",
	"embedMap",
	"about",
	"socialProof",
] as const;

export type SectionTypeId = (typeof SECTION_TYPE_IDS)[number];

const sectionBaseSchema = z.object({
	id: z.string().min(1).max(64),
	hidden: z.boolean().optional(),
	layout: sectionLayoutSchema.optional(),
});

const heroPropsSchema = z.object({
	desktopImageUrl: urlOptional,
	mobileImageUrl: urlOptional,
	desktopBlurDataURL: z.string().optional(),
	mobileBlurDataURL: z.string().optional(),
	headline: z.string().min(1).max(200),
	subtitle: z.string().max(200).optional(),
	description: z.string().min(1).max(2000),
	ctaLabel: z.string().min(1).max(120),
	ctaHref: z.string().min(1).max(512),
	ctaAriaLabel: z.string().max(200).optional(),
	headlineUppercase: z.boolean().optional(),
	ctaShowDownArrow: z.boolean().optional(),
});

const bestsellersPropsSchema = z.object({
	title: z.string().max(120).optional(),
	productIds: z.array(z.string().min(1)).max(4).default([]),
});

const testimonialPropsSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	role: z.string().optional(),
	company: z.string().min(1),
	quote: z.string().min(1),
	imageUrl: urlOptional,
	rating: z.number().min(1).max(5),
	order: z.number().int(),
});

const faqPropsSchema = z.object({
	id: z.string().min(1),
	question: z.string().min(1),
	answer: z.string().min(1),
	order: z.number().int(),
});

const galleryPhotoPropsSchema = z.object({
	id: z.string().min(1),
	imageUrl: urlRequired,
	alt: z.string().max(300).optional(),
	order: z.number().int(),
});

const categoryTilePropsSchema = z.object({
	title: z.string().min(1),
	cta: z.string().min(1),
	href: z.string().min(1),
	imageUrl: urlRequired,
	mobileImageUrl: urlOptional,
	blurDataURL: z.string().optional(),
});

const aboutPropsSchema = z.object({
	sideCaption: z.string().optional(),
	introHeading: z.string().optional(),
	introParagraphs: z.array(z.string().min(1)).optional(),
	introImageUrl: urlOptional,
	introImageAlt: z.string().optional(),
	introLabel: z.string().optional(),
	missionParagraphs: z.array(z.string().min(1)).optional(),
	missionImageUrl: urlOptional,
	missionImageAlt: z.string().optional(),
	missionLabel: z.string().optional(),
	closingParagraphs: z.array(z.string().min(1)).optional(),
	closingImageUrl: urlOptional,
	closingImageAlt: z.string().optional(),
	closingLabel: z.string().optional(),
});

const richTextPropsSchema = z.object({
	heading: z.string().max(200).optional(),
	bodyHtml: z.string().max(20_000),
});

const textImagePropsSchema = z.object({
	heading: z.string().max(200).optional(),
	body: z.string().max(4000).optional(),
	imageUrl: urlOptional,
	imageAlt: z.string().max(300).optional(),
	imagePosition: z.enum(["left", "right"]).default("right"),
});

const ctaPropsSchema = z.object({
	heading: z.string().max(200).optional(),
	subheading: z.string().max(400).optional(),
	ctaLabel: z.string().min(1).max(120),
	ctaHref: z.string().min(1).max(512),
});

const dividerPropsSchema = z.object({
	style: z.enum(["line", "space"]).default("line"),
});

const contactFormPropsSchema = z.object({
	heading: z.string().max(200).optional(),
	intro: z.string().max(1000).optional(),
});

const embedMapPropsSchema = z.object({
	heading: z.string().max(200).optional(),
	embedUrl: z.string().url().max(2048),
});

const socialProofPropsSchema = z.object({}).default({});

const sectionSchemas = [
	sectionBaseSchema.extend({ type: z.literal("hero"), props: heroPropsSchema }),
	sectionBaseSchema.extend({ type: z.literal("bestsellers"), props: bestsellersPropsSchema }),
	sectionBaseSchema.extend({
		type: z.literal("cta"),
		props: z.object({
			heading: z.string().max(200).optional(),
			subheading: z.string().max(400).optional(),
			ctaLabel: z.string().max(120).optional(),
			ctaHref: z.string().max(512).optional(),
			desktopBackgroundUrl: urlOptional,
			desktopBlurDataURL: z.string().optional(),
		}),
	}),
	sectionBaseSchema.extend({ type: z.literal("testimonials"), props: z.object({ items: z.array(testimonialPropsSchema) }) }),
	sectionBaseSchema.extend({ type: z.literal("faq"), props: z.object({ items: z.array(faqPropsSchema) }) }),
	sectionBaseSchema.extend({ type: z.literal("gallery"), props: z.object({ items: z.array(galleryPhotoPropsSchema) }) }),
	sectionBaseSchema.extend({ type: z.literal("categoryTiles"), props: z.object({ items: z.array(categoryTilePropsSchema) }) }),
	sectionBaseSchema.extend({ type: z.literal("about"), props: aboutPropsSchema }),
	sectionBaseSchema.extend({ type: z.literal("richText"), props: richTextPropsSchema }),
	sectionBaseSchema.extend({ type: z.literal("textImage"), props: textImagePropsSchema }),
	sectionBaseSchema.extend({ type: z.literal("divider"), props: dividerPropsSchema }),
	sectionBaseSchema.extend({ type: z.literal("contactForm"), props: contactFormPropsSchema }),
	sectionBaseSchema.extend({ type: z.literal("embedMap"), props: embedMapPropsSchema }),
	sectionBaseSchema.extend({ type: z.literal("socialProof"), props: socialProofPropsSchema }),
] as const;

export const pageSectionSchema = z.union(sectionSchemas as unknown as [typeof sectionSchemas[number], ...typeof sectionSchemas[number][]]);

export type PageSection = z.infer<typeof pageSectionSchema>;

export const pageSectionsArraySchema = z
	.array(pageSectionSchema)
	.max(20, "Maksymalnie 20 sekcji na stronę");

export type PageSections = z.infer<typeof pageSectionsArraySchema>;

export const sectionHistorySchema = z.object({
	versions: z
		.array(
			z.object({
				savedAt: z.string(),
				sections: pageSectionsArraySchema,
			}),
		)
		.max(10),
});

export type SectionHistory = z.infer<typeof sectionHistorySchema>;

/** Sanityzacja pól tekstowych przed zapisem. */
export function sanitizeSectionForSave(section: PageSection): PageSection {
	switch (section.type) {
		case "richText":
			return {
				...section,
				props: {
					...section.props,
					heading: section.props.heading
						? sanitizePlainText(section.props.heading)
						: undefined,
					bodyHtml: sanitizeRichTextHtml(section.props.bodyHtml),
				},
			};
		case "hero":
			return {
				...section,
				props: {
					...section.props,
					headline: sanitizePlainText(section.props.headline),
					subtitle: section.props.subtitle
						? sanitizePlainText(section.props.subtitle)
						: undefined,
					description: sanitizePlainText(section.props.description),
					ctaLabel: sanitizePlainText(section.props.ctaLabel),
				},
			};
		default:
			return section;
	}
}

export function sanitizeSectionsForSave(sections: PageSection[]): PageSection[] {
	return sections.map(sanitizeSectionForSave);
}

export {
	heroPropsSchema,
	bestsellersPropsSchema,
	richTextPropsSchema,
	textImagePropsSchema,
	ctaPropsSchema,
	dividerPropsSchema,
};
