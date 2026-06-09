export type ContactEmailPayload = {
	name: string;
	email: string;
	phone: string;
	message: string;
};

export type ContactEmailRenderVars = {
	imie: string;
	email: string;
	temat: string;
	numerSprawy: string;
	numerFormularza: string;
	wiadomosc: string;
};

const MESSAGE_PREVIEW_MAX = 400;

function truncateMessage(message: string): string {
	const trimmed = message.trim();
	if (trimmed.length <= MESSAGE_PREVIEW_MAX) return trimmed;
	return `${trimmed.slice(0, MESSAGE_PREVIEW_MAX)}…`;
}

/** Generuje numer sprawy formularza kontaktowego (FK-RRRR-NNNNN). */
export function createContactCaseNumber(now = new Date()): string {
	const year = now.getFullYear();
	const suffix = String(Math.floor(Math.random() * 100_000)).padStart(5, "0");
	return `FK-${year}-${suffix}`;
}

export function buildContactEmailRenderVars(
	data: ContactEmailPayload,
	caseNumber: string,
): ContactEmailRenderVars {
	return {
		imie: data.name,
		email: data.email,
		temat: "Formularz kontaktowy",
		numerSprawy: caseNumber,
		numerFormularza: caseNumber,
		wiadomosc: truncateMessage(data.message),
	};
}
