/** Identyfikator podstrony CMS — stabilny, konfigurowany w magazyn.config.ts. */
export type ContentPageId =
	| "home"
	| "shop"
	| "logo-3d"
	| "gotowe-wzory"
	| "certyfikaty"
	| "o-nas";

export type ContentBlockKey =
	| "hero"
	| "about"
	| "brandingCta"
	| "testimonials"
	| "faq"
	| "gallery"
	| "categoryTiles"
	| "announcementBar"
	| "trustBar"
	| "socialLinks"
	| "footerText"
	| "checkoutCallout"
	| "salonLogos"
	| "instagramTiles";

export type SeoMeta = {
	metaTitle?: string;
	metaDescription?: string;
	ogTitle?: string;
	ogDescription?: string;
	ogImageUrl?: string;
	canonicalUrl?: string;
	noIndex?: boolean;
	noFollow?: boolean;
};

export type AnnouncementBar = {
	enabled: boolean;
	text: string;
	link?: string;
};

export type TrustBar = {
	followers?: string;
	realizations?: string;
	shippingLabel?: string;
};

export type CheckoutCallout = {
	enabled?: boolean;
	title?: string;
	message?: string;
	confirmLabel?: string;
};

export type SocialLinks = {
	instagram?: string;
	facebook?: string;
	tiktok?: string;
};

export type SiteSettings = {
	title: string;
	description: string;
	announcementBar?: AnnouncementBar;
	trustBar?: TrustBar;
	checkoutCallout?: CheckoutCallout;
	socialLinks?: SocialLinks;
	footerText?: string;
	seo?: SeoMeta;
	titleTemplate?: string;
	defaultOgImageUrl?: string;
	googleSiteVerification?: string;
};

export type BrandingCtaContent = {
	/** Tło sekcji „Gotowa na branding” (desktop). */
	desktopBackgroundUrl?: string;
	desktopBlurDataURL?: string;
};

export type HeroContent = {
	/** URL tła desktop (WebP z R2). */
	desktopImageUrl?: string;
	/** URL tła mobile. */
	mobileImageUrl?: string;
	desktopBlurDataURL?: string;
	mobileBlurDataURL?: string;
	headline: string;
	subtitle?: string;
	description: string;
	ctaLabel: string;
	ctaHref: string;
	ctaAriaLabel?: string;
	headlineUppercase?: boolean;
	ctaShowDownArrow?: boolean;
};

export type CategoryTile = {
	title: string;
	cta: string;
	href: string;
	imageUrl: string;
	blurDataURL?: string;
};

export type Testimonial = {
	id: string;
	name: string;
	role?: string;
	company: string;
	quote: string;
	imageUrl?: string;
	rating: number;
	order: number;
};

export type FaqItem = {
	id: string;
	question: string;
	answer: string;
	order: number;
};

export type GalleryPhoto = {
	id: string;
	imageUrl: string;
	alt?: string;
	order: number;
};

export type SalonLogo = {
	id: string;
	name: string;
	logoUrl?: string;
	/** Krótki opis — panel admina (opcjonalnie). */
	description?: string;
	/** Tekst alternatywny obrazka — SEO i a11y. */
	alt?: string;
	order: number;
};

export type InstagramTile = {
	id: string;
	postUrl: string;
	imageUrl: string;
	alt?: string;
};

export type AboutPageContent = {
	sideCaption?: string;
	introHeading?: string;
	introParagraphs?: string[];
	introImageUrl?: string;
	introImageAlt?: string;
	introLabel?: string;
	missionParagraphs?: string[];
	missionImageUrl?: string;
	missionImageAlt?: string;
	missionLabel?: string;
	closingImageUrl?: string;
	closingImageAlt?: string;
};

export type PageContent = {
	hero?: HeroContent;
	about?: AboutPageContent;
	brandingCta?: BrandingCtaContent;
	testimonials?: Testimonial[];
	faq?: FaqItem[];
	gallery?: GalleryPhoto[];
	categoryTiles?: CategoryTile[];
};

export type GlobalContent = {
	salonLogos?: SalonLogo[];
	instagramTiles?: InstagramTile[];
};

export type PageSeoMap = Partial<Record<ContentPageId, SeoMeta>>;
export type PageContentMap = Partial<Record<ContentPageId, PageContent>>;

export type ProductSeoMeta = SeoMeta;

export type ProductFaqItem = {
	id: string;
	question: string;
	answer: string;
	order: number;
};
