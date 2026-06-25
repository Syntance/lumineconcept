import { NextResponse } from "next/server";
import { requireAdminSession } from "@magazyn/core/auth/require-session";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import {
	formatCmsUploadError,
	uploadCmsAssetFile,
	validateCmsUploadFile,
} from "@/lib/product-upload/product-file";

export const runtime = "nodejs";
export const maxDuration = 120;

function filesFromFormData(formData: FormData): File[] {
	return formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function POST(request: Request) {
	try {
		await requireAdminSession();

		const formData = await request.formData();
		const files = filesFromFormData(formData);
		if (files.length === 0) {
			return NextResponse.json({ error: "Nie wybrano plików." }, { status: 400 });
		}

		for (const file of files) {
			const validationError = validateCmsUploadFile(file);
			if (validationError) {
				return NextResponse.json({ error: validationError }, { status: 400 });
			}
		}

		const urls: string[] = [];
		for (const file of files) {
			const result = await uploadCmsAssetFile(file);
			urls.push(result.url);
		}

		return NextResponse.json({ urls, error: null });
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) {
			return NextResponse.json({ error: "Sesja wygasła — zaloguj się ponownie." }, { status: 401 });
		}
		if (error instanceof AdminApiError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status >= 500 ? 503 : error.status },
			);
		}

		const message = formatCmsUploadError(error);
		console.error("[cms-upload]", error);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
