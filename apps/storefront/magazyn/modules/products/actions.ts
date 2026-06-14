"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { magazynConfig } from "@magazyn/magazyn.config";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import { adminUpload } from "@magazyn/core/medusa/client";
import { requireAdminSession } from "@magazyn/core/auth/require-session";
import { recordAudit } from "@magazyn/core/audit/audit-log";
import { resolveMedusaMediaUrls } from "@magazyn/core/medusa/media-url";
import { uploadCmsAssetFile } from "@/lib/product-upload/product-file";
import { slugify } from "@magazyn/core/lib/slug";
import { revalidateStorefrontMedusaCache } from "@magazyn/core/lib/revalidate-storefront";
import {
	createAdminProduct,
	deleteAdminProduct,
	type ProductFormValues,
	updateAdminProduct,
} from "./store";

export type SaveProductState = { error: string | null; ok: boolean };

const PRODUCTS_PATH = `${magazynConfig.basePath}/panel/produkty`;

const productSchema = z.object({
	id: z.string().trim().optional(),
	handle: z.string().trim().optional(),
	variantId: z.string().trim().nullable().optional(),
	priceId: z.string().trim().nullable().optional(),
	title: z.string().trim().min(2, "Nazwa musi mieć min. 2 znaki."),
	status: z.enum(["draft", "published"]),
	categoryIds: z.array(z.string().trim().min(1)).default([]),
	description: z.string(),
	price: z.number().nonnegative().nullable(),
	images: z.array(z.string().url()),
	disabledConfigIds: z.array(z.string().trim()).default([]),
	disabledConfigIdsBySlot: z.record(z.string(), z.array(z.string().trim())).default({}),
	disabledColorCategoriesBySlot: z.record(z.string(), z.array(z.string().trim())).default({}),
	allowCustomColorBySlot: z.record(z.string(), z.boolean()).default({}),
	productColorsBySlot: z
		.record(
			z.string(),
			z.record(
				z.string(),
				z.array(
					z.object({
						id: z.string().trim(),
						name: z.string().trim().min(2),
						hex_color: z.string().trim(),
						color_category: z.string().trim(),
						mat_allowed: z.boolean(),
					}),
				),
			),
		)
		.default({}),
	matOverridesBySlot: z
		.record(z.string(), z.record(z.string(), z.boolean()))
		.default({}),
	matOverridesBySlotWithStand: z
		.record(z.string(), z.record(z.string(), z.boolean()))
		.default({}),
	colorSlotCount: z.number().int().min(1).max(5).default(1),
	colorSlotNames: z.array(z.string().trim()).optional(),
	allowCustomColor: z.boolean().default(true),
	textFields: z
		.array(
			z.object({
				key: z.string().trim().min(1),
				label: z.string().trim().min(1),
				hint: z.string().trim().optional(),
				placeholder: z.string().trim().optional(),
				required: z.boolean().optional(),
				maxLength: z.number().int().min(1).max(1000).optional(),
				multiline: z.boolean().optional(),
			}),
		)
		.default([]),
	uploadsEnabled: z.boolean().default(false),
	uploadsRequired: z.boolean().default(false),
	uploadsCount: z.number().int().min(1).max(5).default(1),
	uploadsLabel: z.string().default(""),
	seo: z
		.object({
			metaTitle: z.string().optional(),
			metaDescription: z.string().optional(),
			ogTitle: z.string().optional(),
			ogDescription: z.string().optional(),
			ogImageUrl: z.string().optional(),
			canonicalUrl: z.string().optional(),
			noIndex: z.boolean().optional(),
			noFollow: z.boolean().optional(),
		})
		.default({}),
	productFaq: z
		.array(
			z.object({
				id: z.string().min(1),
				question: z.string().min(1),
				answer: z.string().min(1),
				order: z.number().int(),
			}),
		)
		.default([]),
	standAvailable: z.boolean().default(false),
	standDisabledConfigIds: z.array(z.string().trim()).default([]),
	standDisabledColorCategories: z.array(z.string().trim()).default([]),
	standProductColors: z
		.record(
			z.string(),
			z.array(
				z.object({
					id: z.string().trim(),
					name: z.string().trim().min(2),
					hex_color: z.string().trim(),
					color_category: z.string().trim(),
					mat_allowed: z.boolean(),
				}),
			),
		)
		.default({}),
	standAllowCustomColor: z.boolean().default(true),
	standMatOverrides: z.record(z.string(), z.boolean()).default({}),
	disabledConfigIdsBySlotWithStand: z.record(z.string(), z.array(z.string().trim())).default({}),
	disabledColorCategoriesBySlotWithStand: z.record(z.string(), z.array(z.string().trim())).default({}),
});

export type ProductPayload = z.input<typeof productSchema>;

function toValues(data: z.infer<typeof productSchema>): ProductFormValues {
	const handle =
		data.id && data.handle?.trim()
			? data.handle.trim()
			: slugify(data.title);

	return {
		title: data.title,
		handle,
		status: data.status,
		categoryIds: data.categoryIds ?? [],
		description: data.description,
		price: data.price,
		images: data.images,
		disabledConfigIds: data.disabledConfigIds ?? [],
		disabledConfigIdsBySlot: data.disabledConfigIdsBySlot ?? {},
		disabledColorCategoriesBySlot: data.disabledColorCategoriesBySlot ?? {},
		allowCustomColorBySlot: data.allowCustomColorBySlot ?? {},
		productColorsBySlot: data.productColorsBySlot ?? {},
		matOverridesBySlot: data.matOverridesBySlot ?? {},
		matOverridesBySlotWithStand: data.matOverridesBySlotWithStand ?? {},
		colorSlotCount: data.colorSlotCount ?? 1,
		colorSlotNames: data.colorSlotNames,
		allowCustomColor: data.allowCustomColor ?? true,
		textFields: data.textFields ?? [],
		uploadSettings: {
			enabled: data.uploadsEnabled ?? false,
			required: data.uploadsRequired ?? false,
			count: data.uploadsCount ?? 1,
			label: data.uploadsLabel ?? "",
		},
		seo: data.seo ?? {},
		productFaq: data.productFaq ?? [],
		standAvailable: data.standAvailable ?? false,
		standDisabledConfigIds: data.standDisabledConfigIds ?? [],
		standDisabledColorCategories: data.standDisabledColorCategories ?? [],
		standProductColors: data.standProductColors ?? {},
		standAllowCustomColor: data.standAllowCustomColor ?? true,
		standMatOverrides: data.standMatOverrides ?? {},
		disabledConfigIdsBySlotWithStand: data.disabledConfigIdsBySlotWithStand ?? {},
		disabledColorCategoriesBySlotWithStand: data.disabledColorCategoriesBySlotWithStand ?? {},
	};
}

export async function saveProductAction(payload: ProductPayload): Promise<SaveProductState> {
	const parsed = productSchema.safeParse(payload);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne dane formularza." };
	}

	const data = parsed.data;
	if (data.price == null) return { ok: false, error: "Podaj cenę." };

	const values = toValues(data);
	const productHandle = values.handle;

	try {
		if (data.id) {
			await updateAdminProduct(data.id, values, productHandle);
		} else {
			await createAdminProduct(values);
		}
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać produktu. Spróbuj ponownie." };
	}

	revalidateTag("medusa-products", "max");
	revalidateTag("medusa-categories", "max");
	await revalidateStorefrontMedusaCache();
	if (productHandle) {
		revalidatePath(`/sklep/gotowe-wzory/${productHandle}`);
		revalidatePath(`/sklep/logo-3d/${productHandle}`);
		revalidatePath(`/sklep/certyfikaty/${productHandle}`);
	}
	revalidatePath(PRODUCTS_PATH);

	if (data.id) {
		revalidatePath(`${magazynConfig.basePath}/panel/produkty/${data.id}`);
		return { ok: true, error: null };
	}

	redirect(PRODUCTS_PATH);
}

export async function deleteProductAction(id: string): Promise<void> {
	try {
		await deleteAdminProduct(id);
		await recordAudit("product.delete", { target: id });
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		throw error;
	}
	revalidateTag("medusa-products", "max");
	revalidateTag("medusa-categories", "max");
	revalidatePath(PRODUCTS_PATH);
}

export type UploadState = { urls: string[]; error: string | null };

export async function uploadImagesAction(formData: FormData): Promise<UploadState> {
	const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
	if (files.length === 0) return { urls: [], error: "Nie wybrano plików." };

	try {
		await requireAdminSession();
		const urls: string[] = [];
		for (const file of files) {
			try {
				const result = await uploadCmsAssetFile(file);
				urls.push(result.url);
			} catch (inner) {
				if (inner instanceof Error && inner.message === "MEDUSA_UPLOAD_UNAVAILABLE") {
					const fallback = resolveMedusaMediaUrls(await adminUpload([file]));
					if (fallback[0]) urls.push(fallback[0]);
					continue;
				}
				if (inner instanceof Error && !inner.message.startsWith("MEDUSA_")) {
					return { urls: [], error: inner.message };
				}
				throw inner;
			}
		}
		return { urls, error: null };
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { urls: [], error: error.message };
		return { urls: [], error: "Upload nie powiódł się." };
	}
}
