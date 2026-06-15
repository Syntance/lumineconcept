import { getModulyConfig() } from "@moduly/magazyn-core/config";

export const RESEND_DEFAULT_FROM = "Lumine Concept <kontakt@lumineconcept.pl>";
export const RESEND_DEFAULT_REPLY_TO = "kontakt@lumineconcept.pl";

function trimEnv(value: string | undefined): string | undefined {
	const trimmed = value?.replace(/\r\n/g, "").trim();
	return trimmed || undefined;
}

export type ResendRuntimeConfig = {
	apiKey: string | undefined;
	from: string;
	replyTo: string;
	configured: boolean;
};

export function resolveResendFromAddress(
	fromRaw?: string,
	emailRaw?: string,
	fromName = getModulyConfig().email.fromName,
): string {
	const from = trimEnv(fromRaw);
	if (from) {
		if (from.includes("<")) return from;
		return `${fromName} <${from}>`;
	}
	const email =
		trimEnv(emailRaw) ??
		trimEnv(getModulyConfig().email.contactEmail) ??
		"kontakt@lumineconcept.pl";
	return `${fromName} <${email}>`;
}

export function getResendConfig(): ResendRuntimeConfig {
	const apiKey = trimEnv(process.env.RESEND_API_KEY);
	const from = resolveResendFromAddress(
		process.env.RESEND_FROM,
		process.env.RESEND_FROM_EMAIL,
	);
	const replyTo =
		trimEnv(process.env.RESEND_REPLY_TO) ??
		trimEnv(process.env.CONTACT_INBOX_EMAIL) ??
		getModulyConfig().email.contactEmail;

	return {
		apiKey,
		from,
		replyTo,
		configured: Boolean(apiKey),
	};
}
