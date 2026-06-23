"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { magazynConfig } from "@magazyn/magazyn.config";
import { recordAudit } from "@magazyn/core/audit/audit-log";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import { setShippingOptionCheckoutEnabled, updateShippingOption } from "./store";

export type ShippingActionState = { error: string | null; ok: boolean };

const PATH = `${magazynConfig.basePath}/panel/dostawa`;

const toggleSchema = z.object({
	optionId: z.string().trim().min(1),
	enabled: z.boolean(),
});

const saveSchema = z.object({
	optionId: z.string().trim().min(1),
	name: z.string().trim().min(1, "Nazwa jest wymagana."),
	priceMajor: z.number().min(0, "Cena nie może być ujemna."),
	typeLabel: z.string(),
	typeDescription: z.string(),
	checkoutEnabled: z.boolean(),
});

export async function toggleShippingOptionAction(payload: {
	optionId: string;
	enabled: boolean;
}): Promise<ShippingActionState> {
	const parsed = toggleSchema.safeParse(payload);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne dane." };
	}

	try {
		await setShippingOptionCheckoutEnabled(parsed.data.optionId, parsed.data.enabled);
		await recordAudit("shipping.toggle", {
			target: parsed.data.optionId,
			meta: { enabled: parsed.data.enabled },
		});
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		if (error instanceof Error) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać ustawienia dostawy." };
	}

	revalidatePath(PATH);
	return { ok: true, error: null };
}

export async function saveShippingOptionAction(
	payload: z.input<typeof saveSchema>,
): Promise<ShippingActionState> {
	const parsed = saveSchema.safeParse(payload);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne dane." };
	}

	try {
		await updateShippingOption(parsed.data.optionId, {
			name: parsed.data.name,
			priceMajor: parsed.data.priceMajor,
			typeLabel: parsed.data.typeLabel,
			typeDescription: parsed.data.typeDescription,
			checkoutEnabled: parsed.data.checkoutEnabled,
		});
		await recordAudit("shipping.update", {
			target: parsed.data.optionId,
			meta: {
				name: parsed.data.name,
				priceMajor: parsed.data.priceMajor,
				checkoutEnabled: parsed.data.checkoutEnabled,
			},
		});
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		if (error instanceof Error) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać metody dostawy." };
	}

	revalidatePath(PATH);
	return { ok: true, error: null };
}
