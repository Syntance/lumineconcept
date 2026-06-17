import { NextResponse } from "next/server";
import { requireAdminSession } from "@magazyn/core/auth/require-session";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import {
	createCmsPresignedUpload,
	formatCmsUploadError,
} from "@/lib/product-upload/product-file";

export const runtime = "nodejs";

type PresignBody = {
	filename?: string;
	contentType?: string;
	size?: number;
};

export async function POST(request: Request) {
	try {
		await requireAdminSession();

		const body = (await request.json()) as PresignBody;
		const filename = body.filename?.trim();
		const contentType = body.contentType?.trim() ?? "";
		const size = body.size;

		if (!filename || typeof size !== "number") {
			return NextResponse.json({ error: "Brak nazwy pliku lub rozmiaru." }, { status: 400 });
		}

		const result = await createCmsPresignedUpload({ filename, contentType, size });
		return NextResponse.json({ ...result, error: null });
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
		console.error("[cms-upload/presign]", error);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
