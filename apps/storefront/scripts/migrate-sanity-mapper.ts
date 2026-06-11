/**
 * Mapowanie dokumentów Sanity → klucze Medusa metadata (bez sieci).
 * Używane przez skrypt migracji i testy jednostkowe.
 */

export type SanitySiteSettings = {
	title?: string;
	description?: string;
	announcementBar?: unknown;
	trustBar?: unknown;
	checkoutCallout?: unknown;
	socialLinks?: unknown;
	footerText?: string;
	titleTemplate?: string;
	googleSiteVerification?: string;
	defaultOgImageUrl?: string;
	seo?: {
		metaTitle?: string;
		metaDescription?: string;
		ogTitle?: string;
		ogDescription?: string;
		ogImageUrl?: string;
		canonicalUrl?: string;
		noIndex?: boolean;
		noFollow?: boolean;
	};
};

export type SanityTestimonial = {
	_id: string;
	page: string;
	name: string;
	role?: string;
	company: string;
	quote: string;
	rating?: number;
	order?: number;
	imageUrl?: string;
};

export type SanityFaq = {
	_id: string;
	page: string;
	question: string;
	answer: string;
	order?: number;
};

export type SanityGalleryPhoto = {
	_key: string;
	alt?: string;
	imageUrl?: string;
};

export type SanitySalonLogo = {
	_id: string;
	name: string;
	order?: number;
	logoUrl?: string;
};

export type SanityInstagramTile = {
	_key: string;
	postUrl: string;
	alt?: string;
	imageUrl?: string;
};

export type SanityProductFaq = {
	_id: string;
	productHandle?: string;
	question: string;
	answer: string;
	order?: number;
};

export function mapSiteSettingsToMetadata(
	siteSettings: SanitySiteSettings | null | undefined,
): string {
	return JSON.stringify({
		title: siteSettings?.title ?? "Lumine Concept",
		description: siteSettings?.description ?? "",
		announcementBar: siteSettings?.announcementBar,
		trustBar: siteSettings?.trustBar,
		checkoutCallout: siteSettings?.checkoutCallout,
		socialLinks: siteSettings?.socialLinks,
		footerText: siteSettings?.footerText,
		titleTemplate: siteSettings?.titleTemplate,
		googleSiteVerification: siteSettings?.googleSiteVerification,
		defaultOgImageUrl: siteSettings?.defaultOgImageUrl,
		seo: siteSettings?.seo,
	});
}

export function mapGlobalContentToMetadata(input: {
	salonLogos: SanitySalonLogo[];
	instagramTiles: SanityInstagramTile[];
}): string {
	return JSON.stringify({
		salonLogos: input.salonLogos.map((logo) => ({
			id: logo._id,
			name: logo.name,
			order: logo.order ?? 0,
			logoUrl: logo.logoUrl,
		})),
		instagramTiles: input.instagramTiles
			.filter((t) => t.imageUrl && t.postUrl)
			.map((t) => ({
				id: t._key,
				postUrl: t.postUrl,
				alt: t.alt,
				imageUrl: t.imageUrl!,
			})),
	});
}

export function mapPageContentFromSanity(input: {
	testimonials: SanityTestimonial[];
	faqs: SanityFaq[];
	galleryPhotos?: SanityGalleryPhoto[];
}): Record<string, unknown> {
	const pageContent: Record<string, unknown> = {};

	for (const page of ["home", "shop", "logo-3d", "gotowe-wzory", "certyfikaty", "global"] as const) {
		const pageTestimonials = input.testimonials.filter(
			(t) => t.page === page || t.page === "global",
		);
		if (pageTestimonials.length > 0) {
			const key = page === "global" ? "shop" : page;
			pageContent[key] = {
				...(pageContent[key] as object),
				testimonials: pageTestimonials.map((t) => ({
					id: t._id,
					name: t.name,
					role: t.role,
					company: t.company,
					quote: t.quote,
					rating: t.rating ?? 5,
					order: t.order ?? 0,
					imageUrl: t.imageUrl,
				})),
			};
		}

		const pageFaqs = input.faqs.filter((f) => f.page === page || f.page === "global");
		if (pageFaqs.length > 0) {
			const key = page === "global" ? "gotowe-wzory" : page;
			pageContent[key] = {
				...(pageContent[key] as object),
				faq: pageFaqs.map((f) => ({
					id: f._id,
					question: f.question,
					answer: f.answer,
					order: f.order ?? 0,
				})),
			};
		}
	}

	if (input.galleryPhotos?.length) {
		pageContent["logo-3d"] = {
			...(pageContent["logo-3d"] as object),
			gallery: input.galleryPhotos.map((p, index) => ({
				id: p._key,
				alt: p.alt,
				order: index,
				imageUrl: p.imageUrl ?? "",
			})),
		};
	}

	if (pageContent["gotowe-wzory"] && !pageContent["certyfikaty"]) {
		pageContent["certyfikaty"] = { ...(pageContent["gotowe-wzory"] as object) };
	}

	return pageContent;
}

export function mapProductFaqsByHandle(
	productFaqs: SanityProductFaq[],
): Map<string, Array<{ id: string; question: string; answer: string; order: number }>> {
	const faqsByHandle = new Map<
		string,
		Array<{ id: string; question: string; answer: string; order: number }>
	>();

	for (const pf of productFaqs) {
		const handle = pf.productHandle;
		if (!handle) continue;
		const list = faqsByHandle.get(handle) ?? [];
		list.push({
			id: pf._id,
			question: pf.question,
			answer: pf.answer,
			order: pf.order ?? list.length,
		});
		faqsByHandle.set(handle, list);
	}

	for (const [handle, list] of faqsByHandle) {
		faqsByHandle.set(
			handle,
			[...list].sort((a, b) => a.order - b.order),
		);
	}

	return faqsByHandle;
}
