import { VERCEL_SAFE_UPLOAD_BYTES } from "./constants";

/** Margines pod limit body Vercel (~4.5 MB). */
const UPLOAD_TARGET_BYTES = VERCEL_SAFE_UPLOAD_BYTES - 256 * 1024;

/** Jakość WebP — wizualnie bezstratna dla hero i miniatur. */
const CMS_WEBP_QUALITY = 0.92;

const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence"]);

const SKIP_WEBP_CONVERSION = new Set(["image/gif", "image/svg+xml", "image/webp"]);

export function canCompressCmsImage(file: File): boolean {
	const type = file.type.toLowerCase();
	if (HEIC_TYPES.has(type)) return false;
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	if (ext === "heic" || ext === "heif") return false;
	return type.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Nie udało się odczytać obrazu."));
		};
		img.src = url;
	});
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
	return new Promise((resolve) => {
		canvas.toBlob(resolve, "image/webp", quality);
	});
}

function drawScaled(
	source: CanvasImageSource,
	naturalWidth: number,
	naturalHeight: number,
	maxDim: number,
): HTMLCanvasElement {
	let width = naturalWidth;
	let height = naturalHeight;
	if (Number.isFinite(maxDim) && (width > maxDim || height > maxDim)) {
		const scale = maxDim / Math.max(width, height);
		width = Math.max(1, Math.round(width * scale));
		height = Math.max(1, Math.round(height * scale));
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
	ctx.drawImage(source, 0, 0, width, height);
	return canvas;
}

function webpFilename(originalName: string): string {
	const baseName = originalName.replace(/\.[^.]+$/, "") || "cms";
	return `${baseName}.webp`;
}

async function encodeWebpAtDim(
	source: CanvasImageSource,
	naturalWidth: number,
	naturalHeight: number,
	maxDim: number,
	quality: number,
): Promise<File | null> {
	const canvas = drawScaled(source, naturalWidth, naturalHeight, maxDim);
	const blob = await canvasToWebpBlob(canvas, quality);
	if (!blob) return null;
	return new File([blob], "cms-upload.webp", { type: "image/webp" });
}

async function encodeUnderLimit(
	source: CanvasImageSource,
	naturalWidth: number,
	naturalHeight: number,
	maxDim: number,
): Promise<File | null> {
	const qualities = [0.92, 0.86, 0.8, 0.74, 0.68] as const;

	for (const quality of qualities) {
		const encoded = await encodeWebpAtDim(source, naturalWidth, naturalHeight, maxDim, quality);
		if (encoded && encoded.size <= UPLOAD_TARGET_BYTES) {
			return encoded;
		}
	}
	return null;
}

/**
 * PNG/JPG/AVIF → WebP w pełnej rozdzielczości (jakość 92).
 * GIF/SVG/WebP bez zmian.
 */
export async function convertCmsImageToWebp(file: File): Promise<File> {
	const type = file.type.toLowerCase();
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	if (SKIP_WEBP_CONVERSION.has(type) || ext === "webp" || ext === "gif" || ext === "svg") {
		return file;
	}
	if (!canCompressCmsImage(file)) return file;

	const img = await loadImageFromFile(file);
	const { naturalWidth, naturalHeight } = img;
	const encoded = await encodeWebpAtDim(
		img,
		naturalWidth,
		naturalHeight,
		Number.POSITIVE_INFINITY,
		CMS_WEBP_QUALITY,
	);
	if (!encoded) {
		throw new Error("Nie udało się przekonwertować obrazu do WebP.");
	}
	return new File([encoded], webpFilename(file.name), { type: "image/webp" });
}

/**
 * Przed uploadem: raster → WebP; zbyt duże pliki dodatkowo skalują się do limitu Vercel.
 */
export async function prepareCmsImageForUpload(file: File): Promise<File> {
	const webp = await convertCmsImageToWebp(file);
	if (webp.size <= UPLOAD_TARGET_BYTES) return webp;
	return compressCmsImageForUpload(webp);
}

/**
 * Kompresuje obraz CMS do WebP ≤ ~3.75 MB — mieści się w limicie API Vercel,
 * serwer wysyła dalej do R2 (bez presigned PUT z przeglądarki / CORS).
 */
export async function compressCmsImageForUpload(file: File): Promise<File> {
	if (file.size <= UPLOAD_TARGET_BYTES) return file;

	const img = await loadImageFromFile(file);
	const { naturalWidth, naturalHeight } = img;

	for (const maxDim of [3840, 3200, 2560, 1920, 1600]) {
		const encoded = await encodeUnderLimit(img, naturalWidth, naturalHeight, maxDim);
		if (encoded) {
			return new File([encoded], webpFilename(file.name), { type: "image/webp" });
		}
	}

	throw new Error(
		"Nie udało się zmniejszyć pliku do limitu uploadu. Użyj JPG/WebP o mniejszej rozdzielczości.",
	);
}
