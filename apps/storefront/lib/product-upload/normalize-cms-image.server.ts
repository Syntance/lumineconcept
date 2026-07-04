import "server-only";
import sharp from "sharp";
import { inferCmsMimeType, isCmsHeicFile } from "./cms-mime";

const CMS_WEBP_QUALITY = 92;

const SKIP_WEBP_CONVERSION = new Set(["image/gif", "image/webp"]);

function webpFilename(originalName: string): string {
	const baseName = originalName.replace(/\.[^.]+$/, "") || "cms";
	return `${baseName}.webp`;
}

export async function normalizeCmsImageFileToWebp(file: File): Promise<File> {
	const mime = inferCmsMimeType(file);
	if (!mime || SKIP_WEBP_CONVERSION.has(mime)) {
		return file;
	}

	const input = Buffer.from(await file.arrayBuffer());
	const fromHeic = isCmsHeicFile(file);

	try {
		const webp = await sharp(input, { failOn: "none" })
			.rotate()
			.webp({ quality: CMS_WEBP_QUALITY, effort: 4 })
			.toBuffer();

		return new File([new Uint8Array(webp)], webpFilename(file.name), { type: "image/webp" });
	} catch (error) {
		if (fromHeic) {
			throw new Error("CMS_HEIC_CONVERSION_FAILED", { cause: error });
		}
		throw error instanceof Error ? error : new Error("CMS_IMAGE_CONVERSION_FAILED");
	}
}
