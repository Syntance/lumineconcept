import type { MagazynConfig } from "./core/config/types";

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  KONFIGURACJA PANELU — edytuj TYLKO ten plik pod nowy sklep.  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Sekrety (klucze API, hasła) trzymaj w `.env.local` — patrz `.env.example`.
 * Tu ustawiasz branding, ścieżkę panelu, włączone moduły, motyw maili i teksty.
 */
export const magazynConfig: MagazynConfig = {
	basePath: "/magazyn",

	branding: {
		name: "Lumine Concept",
		panelTitle: "Magazyn Lumine",
		storefrontUrl: "https://lumineconcept.pl",
	},

	auth: {
		cookieName: "lumine_admin_session",
		google: false,
	},

	modules: {
		orders: true,
		products: true,
		categories: true,
		emails: true,
		settings: true,
	},

	email: {
		fromName: "Lumine Concept",
		contactEmail: "kontakt@lumineconcept.pl",
		footerText: "Lumine Concept · Innowacyjne rozwiązania oświetleniowe i dekoracyjne",
		siteUrl: "https://lumineconcept.pl",
	},

	bankTransfer: {
		recipientName: "Lumine Concept",
		iban: "PL58105011001000009085809698",
		swift: "INGBPLPW",
		addressLine1: "Jana Pawła II 93",
		addressLine2: "34-115 Ryczów",
		paymentDays: 5,
		transferTitlePrefix: "Zamówienie",
	},

	emailTheme: {
		bg: "#EEE8E0",
		contentBg: "#FFFDF8",
		text: "#725750",
		heading: "#725750",
		accent: "#AF7C61",
		muted: "#8f7a74",
		link: "#AF7C61",
		fontKey: "serif",
		contentWidth: 600,
		radius: 10,
		headerBg: "#725750",
		headerText: "#EEE8E0",
		brandName: "Lumine Concept",
	},

	currency: "pln",
	locale: "pl-PL",
};
