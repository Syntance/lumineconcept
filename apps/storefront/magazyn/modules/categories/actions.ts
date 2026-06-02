"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { magazynConfig } from "@magazyn/magazyn.config";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import { slugify } from "@magazyn/core/lib/slug";
import { type CategoryInput, createCategory, deleteCategory, updateCategory } from "./store";

export type CategoryActionState = { error: string | null; ok: boolean };

const PATH = `${magazynConfig.basePath}/panel/kategorie`;

const schema = z.object({
	id: z.string().trim().optional(),
	name: z.string().trim().min(2, "Nazwa musi mieć min. 2 znaki."),
	description: z.string(),
	isActive: z.boolean(),
});

export type CategoryPayload = z.input<typeof schema>;

export async function saveCategoryAction(payload: CategoryPayload): Promise<CategoryActionState> {
	const parsed = schema.safeParse(payload);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne dane." };
	}

	const data = parsed.data;
	const input: CategoryInput = {
		name: data.name,
		handle: slugify(data.name),
		description: data.description,
		isActive: data.isActive,
	};

	try {
		if (data.id) await updateCategory(data.id, input);
		else await createCategory(input);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać kategorii." };
	}

	revalidatePath(PATH);
	return { ok: true, error: null };
}

export async function deleteCategoryAction(id: string): Promise<CategoryActionState> {
	try {
		await deleteCategory(id);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się usunąć kategorii." };
	}

	revalidatePath(PATH);
	return { ok: true, error: null };
}
