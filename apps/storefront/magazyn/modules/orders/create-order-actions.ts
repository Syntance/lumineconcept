"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { magazynConfig } from "@magazyn/magazyn.config";
import { recordAudit } from "@magazyn/core/audit/audit-log";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import { requireAdminSession } from "@magazyn/core/auth/require-session";
import { createManualOrder, searchOrderFormProducts } from "./create-order-store";
import { getManualOrderProductConfig } from "./create-order-product-config";

export type CreateManualOrderState = { ok: boolean; error: string | null };

const ORDERS_PATH = `${magazynConfig.basePath}/panel/zamowienia`;

const lineSchema = z.object({
	variantId: z.string().trim().min(1),
	productTitle: z.string().trim().min(1),
	quantity: z.number().int().min(1).max(999),
	metadata: z.record(z.string(), z.string()).optional(),
	lineNote: z.string().trim().optional(),
});

const createManualOrderSchema = z.object({
	email: z.string().trim().email("Podaj poprawny adres e-mail."),
	firstName: z.string().trim().min(1, "Imię jest wymagane."),
	lastName: z.string().trim().min(1, "Nazwisko jest wymagane."),
	phone: z.string().trim().optional(),
	address1: z.string().trim().min(1, "Ulica i numer są wymagane."),
	postalCode: z
		.string()
		.trim()
		.regex(/^\d{2}-\d{3}$/, "Kod pocztowy w formacie 00-000."),
	city: z.string().trim().min(1, "Miasto jest wymagane."),
	companyName: z.string().trim().optional(),
	nip: z.string().trim().optional(),
	orderNotes: z.string().trim().optional(),
	sourceChannel: z.enum(["instagram", "email", "telefon", "inne"]),
	shippingOptionId: z.string().trim().min(1, "Wybierz metodę dostawy."),
	items: z.array(lineSchema).min(1, "Dodaj co najmniej jedną pozycję."),
	sendConfirmationEmail: z.boolean(),
	invoiceRequested: z.boolean(),
});

export async function searchOrderProductsAction(query: string) {
	await requireAdminSession();
	return searchOrderFormProducts(query);
}

export async function getManualOrderProductConfigAction(productId: string) {
	await requireAdminSession();
	return getManualOrderProductConfig(productId);
}

export async function createManualOrderAction(payload: unknown): Promise<CreateManualOrderState> {
	const parsed = createManualOrderSchema.safeParse(payload);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne dane formularza." };
	}

	try {
		await requireAdminSession();
		const result = await createManualOrder(parsed.data);
		await recordAudit("order.create.manual", {
			target: result.orderId,
			meta: { source: parsed.data.sourceChannel },
		});
		revalidatePath(ORDERS_PATH);
		redirect(`${ORDERS_PATH}/${result.orderId}`);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		if (error instanceof Error) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się utworzyć zamówienia." };
	}
}
