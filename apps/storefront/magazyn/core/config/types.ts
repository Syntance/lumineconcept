/**
 * Typy konfiguracji modułów. Jeden plik `magazyn.config.ts` w korzeniu steruje
 * całym panelem: brandingiem, włączonymi modułami, motywem maili i tekstami.
 *
 * Plik configu jest importowany zarówno po stronie serwera, jak i klienta —
 * NIE umieszczaj w nim sekretów (te trzymaj w ENV).
 */

export type EmailThemeConfig = {
	bg: string;
	contentBg: string;
	text: string;
	heading: string;
	accent: string;
	muted: string;
	link: string;
	fontKey: "serif" | "sans" | "mono";
	contentWidth: number;
	radius: number;
	headerBg: string;
	headerText: string;
	brandName: string;
};

export type ModulesToggle = {
	orders: boolean;
	products: boolean;
	categories: boolean;
	emails: boolean;
};

export type BrandingConfig = {
	/** Nazwa marki — nagłówek panelu i domyślny brand maili. */
	name: string;
	/** Podtytuł panelu (np. „Magazyn", „Panel", „Dashboard"). */
	panelTitle: string;
	/** Adres publicznego sklepu (link „Otwórz sklep"). */
	storefrontUrl: string;
};

export type EmailConfig = {
	/** Nazwa nadawcy w polu From (adres bierze się z RESEND_FROM_EMAIL). */
	fromName: string;
	/** Adres kontaktowy wstawiany do treści maili. */
	contactEmail: string;
	/** Domyślna stopka maili. */
	footerText: string;
	/** Bazowy URL używany w linkach maili (najczęściej = storefrontUrl). */
	siteUrl: string;
};

export type AuthConfig = {
	/** Nazwa cookie z tokenem sesji admina. Zmień per sklep, by uniknąć kolizji. */
	cookieName: string;
	/** Pokaż przycisk „Zaloguj przez Google" (wymaga providera w backendzie). */
	google: boolean;
};

export type MagazynConfig = {
	/** Bazowa ścieżka panelu, np. „/magazyn", „/panel", „/admin". */
	basePath: string;
	branding: BrandingConfig;
	auth: AuthConfig;
	modules: ModulesToggle;
	email: EmailConfig;
	/** Domyślny motyw maili (punkt startowy edytora dla nowych szablonów). */
	emailTheme: EmailThemeConfig;
	/** Waluta używana w cenach produktów (kod ISO, np. „pln", „eur"). */
	currency: string;
	/** Locale do formatowania cen/dat (np. „pl-PL"). */
	locale: string;
};
