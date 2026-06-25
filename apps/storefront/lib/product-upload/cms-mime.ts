const CMS_HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence"]);

const CMS_IMAGE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/pjpeg",
	"image/webp",
	"image/gif",
	"image/avif",
	...CMS_HEIC_TYPES,
]);

const CMS_EXT_TO_MIME: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	webp: "image/webp",
	gif: "image/gif",
	avif: "image/avif",
	heic: "image/heic",
	heif: "image/heif",
};

/** Etykieta formatów w UI panelu CMS. */
export const CMS_ALLOWED_IMAGE_FORMATS_LABEL =
	"JPG, PNG, WEBP, GIF, AVIF, HEIC (iPhone → WebP)";

export function isCmsHeicFile(file: File): boolean {
	const type = file.type.toLowerCase();
	if (CMS_HEIC_TYPES.has(type)) return true;
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	return ext === "heic" || ext === "heif";
}

export function isCmsHeicMeta(filename: string, contentType: string): boolean {
	const type = contentType.toLowerCase();
	if (CMS_HEIC_TYPES.has(type)) return true;
	const ext = filename.split(".").pop()?.toLowerCase() ?? "";
	return ext === "heic" || ext === "heif";
}

export function inferCmsMimeType(file: File): string | null {
	const type = file.type.toLowerCase();
	if (CMS_IMAGE_TYPES.has(type)) return type;
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	const fromExt = CMS_EXT_TO_MIME[ext];
	return fromExt && CMS_IMAGE_TYPES.has(fromExt) ? fromExt : null;
}

export function inferCmsMimeFromMeta(filename: string, contentType: string): string | null {
	const type = contentType.toLowerCase();
	if (CMS_IMAGE_TYPES.has(type)) return type;
	const ext = filename.split(".").pop()?.toLowerCase() ?? "";
	const fromExt = CMS_EXT_TO_MIME[ext];
	return fromExt && CMS_IMAGE_TYPES.has(fromExt) ? fromExt : null;
}

export function isRasterCmsImageMime(mime: string | null | undefined): boolean {
	if (!mime) return false;
	return mime.startsWith("image/") && mime !== "image/gif" && mime !== "image/svg+xml";
}
