import "server-only";
import { adminFetch, serviceAdminFetch } from "@magazyn/core/medusa/client";
import {
	buildDefaultTemplate,
	EMAIL_TEMPLATE_TYPES,
	type EmailTemplate,
	type EmailTemplateType,
	emailTemplateSchema,
	parseTemplate,
} from "./template-types";

const METADATA_KEY = "email_templates";

type MedusaStore = { id: string; metadata?: Record<string, unknown> | null };

async function getStore(): Promise<MedusaStore> {
	const data = await adminFetch<{ stores: MedusaStore[] }>(
		"/admin/stores?limit=1&fields=id,metadata",
	);
	const store = data.stores[0];
	if (!store) throw new Error("Nie znaleziono sklepu w Medusa.");
	return store;
}

/** Parsuje mapę szablonów z metadanych; nieprawidłowe wpisy są pomijane. */
function parseMap(raw: unknown): Record<string, EmailTemplate> {
	if (typeof raw !== "string" || !raw.trim()) return {};
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== "object") return {};
		const out: Record<string, EmailTemplate> = {};
		for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
			const template = parseTemplate(value);
			if (template) out[key] = template;
		}
		return out;
	} catch {
		return {};
	}
}

async function writeMap(store: MedusaStore, map: Record<string, EmailTemplate>): Promise<void> {
	await adminFetch(`/admin/stores/${store.id}`, {
		method: "POST",
		body: JSON.stringify({
			metadata: { ...(store.metadata ?? {}), [METADATA_KEY]: JSON.stringify(map) },
		}),
	});
}

/** Wszystkie szablony do edytora — zapisany lub domyślny gdy brak. */
export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
	const store = await getStore();
	const map = parseMap(store.metadata?.[METADATA_KEY]);
	return EMAIL_TEMPLATE_TYPES.map(({ type }) => map[type] ?? buildDefaultTemplate(type));
}

/** Zapisuje pojedynczy szablon (merge do istniejącej mapy). */
export async function saveEmailTemplate(template: EmailTemplate): Promise<void> {
	const parsed = emailTemplateSchema.safeParse(template);
	if (!parsed.success) throw new Error("Nieprawidłowy szablon maila.");

	const store = await getStore();
	const map = parseMap(store.metadata?.[METADATA_KEY]);
	map[parsed.data.type] = parsed.data as EmailTemplate;
	await writeMap(store, map);
}

/** Przywraca domyślny szablon (usuwa zapisany override z metadanych). */
export async function resetEmailTemplate(type: EmailTemplateType): Promise<EmailTemplate> {
	const store = await getStore();
	const map = parseMap(store.metadata?.[METADATA_KEY]);
	delete map[type];
	await writeMap(store, map);
	return buildDefaultTemplate(type);
}

/**
 * Szablon do realnej wysyłki (pipeline). Konto serwisowe (MEDUSA_ADMIN_*),
 * więc działa też bez sesji panelu. Zwraca null gdy brak zapisanego override.
 */
export async function getEmailTemplateForSend(
	type: EmailTemplateType,
): Promise<EmailTemplate | null> {
	const data = await serviceAdminFetch<{ stores: MedusaStore[] }>(
		"/admin/stores?limit=1&fields=id,metadata",
	);
	const raw = data?.stores?.[0]?.metadata?.[METADATA_KEY];
	const map = parseMap(raw);
	return map[type] ?? null;
}
