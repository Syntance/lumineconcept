import "server-only";
import sharp from "sharp";
import { inferCmsMimeType } from "./cms-mime";

const CMS_WEBP_QUALITY = 92;

const SKIP_WEBP_CONVERSION = new Set(["image/gif", "image/svg+xml", "image/webp"]);

export async function normalizeCmsImageFileToWebp(file: File): Promise<File> {
	const mime = inferCmsMimeType(file);
	if (!mime || SKIP_WEBP_CONVERSION.has(mime)) {
		return file;
	}

	const input = Buffer.from(await file.arrayBuffer());
	const webp = await sharp(input)
		.rotate()
		.webp({ quality: CMS_WEBP_QUALITY, effort: 4 })
		.toBuffer();
	const baseName = file.name.replace(/\.[^.]+$/, "") || "cms";
	return new File([new Uint8Array(webp)], `${baseName}.webp`, { type: "image/webp" });
}
