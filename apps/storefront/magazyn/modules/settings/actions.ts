"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { magazynConfig } from "@magazyn/magazyn.config";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import { revalidateStorefrontMedusaCache } from "@magazyn/core/lib/revalidate-storefront";
import type { ColorCategoryId } from "@magazyn/modules/products/color-categories";
import {
	createGlobalColorOption,
	deleteGlobalColorOption,
	type ConfigOption,
} from "@magazyn/modules/products/store";

const SETTINGS_COLORS_PATH = `${magazynConfig.basePath}/panel/ustawienia/kolory`;
const colorCategorySchema = z.enum(["standard", "color", "mirror", "custom"]);

export type CreateColorState = {
	ok: boolean;
	error: string | null;
	option: ConfigOption | null;
};

export type DeleteColorState = {
	ok: boolean;
	error: string | null;
};

async function revalidateGlobalColors() {
	revalidateTag("medusa-products", "max");
	await revalidateStorefrontMedusaCache();
	revalidatePath(SETTINGS_COLORS_PATH);
}

export async function createColorOptionAction(input: {
	name: string;
	hex_color: string;
	color_category: ColorCategoryId;
}): Promise<CreateColorState> {
	const parsed = z
		.object({
			name: z.string().trim().min(2, "Nazwa musi mieć min. 2 znaki."),
			hex_color: z.string().trim().min(1, "Podaj kolor HEX."),
			color_category: colorCategorySchema,
		})
		.safeParse(input);

	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne dane.", option: null };
	}

	try {
		const option = await createGlobalColorOption(parsed.data);
		await revalidateGlobalColors();
		return { ok: true, error: null, option };
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message, option: null };
		if (error instanceof Error) return { ok: false, error: error.message, option: null };
		return { ok: false, error: "Nie udało się dodać koloru.", option: null };
	}
}

export async function deleteColorOptionAction(id: string): Promise<DeleteColorState> {
	const parsed = z.string().trim().min(1).safeParse(id);
	if (!parsed.success) {
		return { ok: false, error: "Nieprawidłowy identyfikator koloru." };
	}

	try {
		await deleteGlobalColorOption(parsed.data);
		await revalidateGlobalColors();
		return { ok: true, error: null };
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		if (error instanceof Error) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się usunąć koloru." };
	}
}
