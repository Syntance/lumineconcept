"use client";

import { uploadImagesAction } from "@magazyn/modules/products/actions";
import { isNetworkFetchError, isServerActionTransportError } from "./cms-upload-errors";
import { VERCEL_SAFE_UPLOAD_BYTES, VERCEL_SAFE_UPLOAD_MB } from "./constants";
import {
	canCompressCmsImage,
	compressCmsImageForUpload,
	prepareCmsImageForUpload,
} from "./compress-cms-image";

async function uploadViaServerAction(file: File): Promise<string> {
	const formData = new FormData();
	formData.append("files", file);
	const result = await uploadImagesAction(formData);
	if (result.error) throw new Error(result.error);
	const url = result.urls[0];
	if (!url) throw new Error("Upload nie zwrócił adresu pliku.");
	return url;
}

type PresignResponse = {
	uploadUrl?: string;
	publicUrl?: string;
	error?: string | null;
};

async function uploadViaPresignedPut(file: File): Promise<string> {
	const presignRes = await fetch("/api/magazyn/cms-upload/presign", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			filename: file.name,
			contentType: file.type,
			size: file.size,
		}),
		signal: AbortSignal.timeout(30_000),
	});

	const data = (await presignRes.json()) as PresignResponse;
	if (!presignRes.ok || data.error) {
		throw new Error(data.error ?? "Nie udało się przygotować uploadu.");
	}
	if (!data.uploadUrl || !data.publicUrl) {
		throw new Error("Nie udało się przygotować uploadu.");
	}

	const putRes = await fetch(data.uploadUrl, {
		method: "PUT",
		headers: { "Content-Type": file.type || "application/octet-stream" },
		body: file,
		signal: AbortSignal.timeout(120_000),
	});

	if (!putRes.ok) {
		throw new Error("Upload do magazynu plików nie powiódł się. Spróbuj mniejszego pliku WebP/JPG.");
	}

	return data.publicUrl;
}

async function uploadPreparedFile(file: File): Promise<string> {
	if (file.size > VERCEL_SAFE_UPLOAD_BYTES) {
		return uploadViaPresignedPut(file);
	}
	return uploadViaServerAction(file);
}

/**
 * Upload CMS z panelu: WebP + skala pod limit Vercel, większe pliki → presigned PUT do R2.
 */
export async function uploadCmsImageFromClient(file: File): Promise<string> {
	if (!canCompressCmsImage(file) && file.size > VERCEL_SAFE_UPLOAD_BYTES) {
		throw new Error(
			`Plik jest za duży (maks. ${VERCEL_SAFE_UPLOAD_MB} MB w panelu). Eksportuj jako JPG/WebP lub zmniejsz rozdzielczość.`,
		);
	}

	let prepared = file;
	if (canCompressCmsImage(file)) {
		prepared = await prepareCmsImageForUpload(file);
	}

	try {
		return await uploadPreparedFile(prepared);
	} catch (error) {
		const retryable =
			canCompressCmsImage(file) &&
			(isServerActionTransportError(error) || isNetworkFetchError(error));
		if (!retryable) throw error;

		const compressed = await compressCmsImageForUpload(file);
		return uploadPreparedFile(compressed);
	}
}
