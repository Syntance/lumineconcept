import "server-only";
import { put } from "@vercel/blob";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { resolveMedusaAdminEmail } from "@/magazyn/core/medusa/admin-email";
import { inferCmsMimeFromMeta, inferCmsMimeType, CMS_ALLOWED_IMAGE_FORMATS_LABEL } from "./cms-mime";
import { normalizeCmsImageFileToWebp } from "./normalize-cms-image.server";
import { MAX_CMS_UPLOAD_BYTES, MAX_CMS_UPLOAD_MB, MAX_UPLOAD_BYTES, VERCEL_SAFE_UPLOAD_MB } from "./constants";

export { MAX_CMS_UPLOAD_BYTES, MAX_CMS_UPLOAD_MB, MAX_UPLOAD_BYTES } from "./constants";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/postscript",
]);

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
  ai: "application/postscript",
  eps: "application/postscript",
};

export type ProductUploadResult = {
  url: string;
  filename: string;
  size: number;
};

function medusaBackendUrl(): string {
  const url =
    process.env.MEDUSA_BACKEND_URL ??
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
    "";
  return url.replace(/\/$/, "");
}

function resolveMedusaFileUrl(url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  const base = medusaBackendUrl();
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function inferMimeType(file: File): string | null {
  if (file.type && ALLOWED_TYPES.has(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fromExt = EXT_TO_MIME[ext];
  return fromExt && ALLOWED_TYPES.has(fromExt) ? fromExt : null;
}

async function getMedusaServiceToken(): Promise<string | null> {
  const rawEmail = process.env.MEDUSA_ADMIN_EMAIL?.trim();
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  const base = medusaBackendUrl();
  if (!rawEmail || !password || !base) return null;
  const email = resolveMedusaAdminEmail(rawEmail);

  const res = await fetch(`${base}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { token?: string };
  return data.token ?? null;
}

async function uploadViaMedusa(file: File): Promise<ProductUploadResult> {
  const token = await getMedusaServiceToken();
  const base = medusaBackendUrl();
  if (!token || !base) {
    throw new Error("MEDUSA_UPLOAD_UNAVAILABLE");
  }

  const form = new FormData();
  form.append("files", file, file.name);

  const res = await fetch(`${base}/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    throw new Error(`MEDUSA_UPLOAD_FAILED_${res.status}`);
  }

  const data = (await res.json()) as { files?: Array<{ url?: string }> };
  const url = data.files?.[0]?.url;
  if (!url) throw new Error("MEDUSA_UPLOAD_EMPTY");

  return {
    url: resolveMedusaFileUrl(url),
    filename: file.name,
    size: file.size,
  };
}

async function uploadViaVercelBlob(file: File): Promise<ProductUploadResult> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = `product-uploads/${timestamp}-${safeName}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return { url: blob.url, filename: file.name, size: file.size };
}

let cachedR2: S3Client | null = null;

const R2_UPLOAD_TIMEOUT_MS = 15_000;
const LARGE_R2_UPLOAD_TIMEOUT_MS = 120_000;

async function withUploadTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = R2_UPLOAD_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function getR2Config() {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const fileUrl =
    process.env.S3_FILE_URL?.trim() || process.env.NEXT_PUBLIC_S3_FILE_URL?.trim();

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !fileUrl) {
    return null;
  }
  return { endpoint, accessKeyId, secretAccessKey, bucket, fileUrl };
}

/**
 * Upload bezpośrednio do Cloudflare R2 (S3-compatible). Preferowany na produkcji:
 * trwałe, off-site, niezależne od backendu Medusy/Railway. Pliki klientów lądują
 * pod osobnym prefiksem `customer-uploads/`, żeby łatwo je odróżnić od assetów sklepu.
 */
async function uploadViaR2(
  file: File,
  config: NonNullable<ReturnType<typeof getR2Config>>,
  keyPrefix: string,
  timeoutMs = R2_UPLOAD_TIMEOUT_MS,
): Promise<ProductUploadResult> {
  if (!cachedR2) {
    cachedR2 = new S3Client({
      region: process.env.S3_REGION?.trim() || "auto",
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix = keyPrefix.endsWith("/") ? keyPrefix : `${keyPrefix}/`;
  const key = `${prefix}${timestamp}-${random}-${safeName}`;

  const contentType =
    inferCmsMimeType(file) ?? inferMimeType(file) ?? (file.type || "application/octet-stream");
  const body = new Uint8Array(await file.arrayBuffer());

  await withUploadTimeout(
    cachedR2.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentLength: body.byteLength,
        ContentType: contentType,
      }),
    ),
    "R2_UPLOAD",
    timeoutMs,
  );

  const base = config.fileUrl.replace(/\/$/, "");
  return { url: `${base}/${key}`, filename: file.name, size: file.size };
}

export function validateProductUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Plik jest za duży (maks. ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB)`;
  }
  if (!inferMimeType(file)) {
    return "Niedozwolony typ pliku (PNG, JPG, WEBP, PDF, AI, EPS)";
  }
  return null;
}

export function formatCmsUploadError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Upload nie powiódł się. Spróbuj ponownie.";
  }

  const msg = error.message;
  if (msg.includes("Plik jest za duży") || msg.includes("Dozwolone formaty")) return msg;
  if (msg === "R2_UPLOAD_TIMEOUT") {
    return "Upload trwa zbyt długo. Spróbuj ponownie lub mniejszy plik (JPG/WebP).";
  }
  if (msg.startsWith("MEDUSA_UPLOAD_FAILED_413")) {
    return `Plik jest za duży dla serwera (maks. ${MAX_CMS_UPLOAD_MB} MB). Zapisz jako JPG/WebP.`;
  }
  if (msg.startsWith("MEDUSA_UPLOAD_FAILED_")) {
    return `Serwer odrzucił plik. Spróbuj JPG/WebP do ${MAX_CMS_UPLOAD_MB} MB.`;
  }
  if (msg === "R2_UPLOAD_FAILED" || msg.endsWith("_TIMEOUT")) {
    return "Upload do magazynu plików nie powiódł się. Spróbuj ponownie.";
  }
  if (msg === "CMS_R2_NOT_CONFIGURED") {
    return "Upload CMS wymaga R2. Ustaw S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY i S3_FILE_URL w Vercel (projekt storefront → Environment Variables) oraz lokalnie w .env.local.";
  }
  if (msg === "CMS_HEIC_CONVERSION_FAILED") {
    return "Nie udało się przekonwertować HEIC (iPhone) do WebP. Wyeksportuj zdjęcie jako JPG lub spróbuj ponownie.";
  }
  if (msg === "CMS_IMAGE_CONVERSION_FAILED") {
    return "Nie udało się przetworzyć obrazu. Spróbuj JPG lub WebP.";
  }
  if (msg === "R2_PRESIGN_UNAVAILABLE") {
    return `Pliki powyżej ${VERCEL_SAFE_UPLOAD_MB} MB wymagają R2 (S3_* na Vercel). Zmniejsz plik lub skonfiguruj magazyn.`;
  }
  if (msg === "MEDUSA_UPLOAD_UNAVAILABLE") {
    return "Magazyn plików niedostępny. Ustaw S3/R2 (S3_*) na Vercel lub MEDUSA_ADMIN_EMAIL + MEDUSA_ADMIN_PASSWORD.";
  }
  if (msg.startsWith("MEDUSA_")) {
    return `Upload nie powiódł się. Spróbuj JPG/WebP do ${MAX_CMS_UPLOAD_MB} MB.`;
  }
  return msg;
}

export function validateCmsUploadFile(file: File): string | null {
  if (file.size > MAX_CMS_UPLOAD_BYTES) {
    return `Plik jest za duży (maks. ${MAX_CMS_UPLOAD_MB} MB). Zapisz jako JPG/WebP lub zmniejsz rozdzielczość.`;
  }
  if (!inferCmsMimeType(file)) {
    return `Dozwolone formaty: ${CMS_ALLOWED_IMAGE_FORMATS_LABEL}.`;
  }
  return null;
}

/** Assety CMS (hero, galeria, OG) — wyłącznie R2 (Medusa /static/ nie nadaje się do podglądu w panelu). */
export async function uploadCmsAssetFile(file: File): Promise<ProductUploadResult> {
  const validationError = validateCmsUploadFile(file);
  if (validationError) throw new Error(validationError);

  const normalized = await normalizeCmsImageFileToWebp(file);
  const normalizedValidation = validateCmsUploadFile(normalized);
  if (normalizedValidation) throw new Error(normalizedValidation);

  const r2 = getR2Config();
  if (!r2) {
    throw new Error("CMS_R2_NOT_CONFIGURED");
  }

  try {
    return await uploadViaR2(normalized, r2, "cms-uploads", LARGE_R2_UPLOAD_TIMEOUT_MS);
  } catch (error) {
    if (error instanceof Error && error.message === "R2_UPLOAD_TIMEOUT") {
      throw new Error(
        "Upload do R2 trwa zbyt długo. Sprawdź połączenie lub spróbuj mniejszego pliku (WebP/JPG).",
        { cause: error },
      );
    }
    throw error instanceof Error ? error : new Error("R2_UPLOAD_FAILED");
  }
}

export type CmsPresignedUpload = {
  uploadUrl: string;
  publicUrl: string;
};

export function validateCmsUploadMeta(
  filename: string,
  contentType: string,
  size: number,
): string | null {
  if (size > MAX_CMS_UPLOAD_BYTES) {
    return `Plik jest za duży (maks. ${MAX_CMS_UPLOAD_MB} MB). Zapisz jako JPG/WebP lub zmniejsz rozdzielczość.`;
  }
  if (size <= 0) return "Nieprawidłowy rozmiar pliku.";
  if (!inferCmsMimeFromMeta(filename, contentType)) {
    return `Dozwolone formaty: ${CMS_ALLOWED_IMAGE_FORMATS_LABEL}.`;
  }
  return null;
}

function buildCmsUploadKey(filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `cms-uploads/${timestamp}-${random}-${safeName}`;
}

function getOrCreateR2Client(config: NonNullable<ReturnType<typeof getR2Config>>): S3Client {
  if (!cachedR2) {
    cachedR2 = new S3Client({
      region: process.env.S3_REGION?.trim() || "auto",
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return cachedR2;
}

/** Presigned PUT — upload z przeglądarki prosto do R2 (omija limit body Vercel ~4.5 MB). */
export async function createCmsPresignedUpload(params: {
  filename: string;
  contentType: string;
  size: number;
}): Promise<CmsPresignedUpload> {
  const validationError = validateCmsUploadMeta(
    params.filename,
    params.contentType,
    params.size,
  );
  if (validationError) throw new Error(validationError);

  const r2 = getR2Config();
  if (!r2) throw new Error("R2_PRESIGN_UNAVAILABLE");

  const resolvedType = inferCmsMimeFromMeta(params.filename, params.contentType);
  if (!resolvedType) throw new Error("Dozwolone formaty: JPG, PNG, WEBP, GIF, AVIF.");

  const key = buildCmsUploadKey(params.filename);
  const client = getOrCreateR2Client(r2);

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      ContentType: resolvedType,
      ContentLength: params.size,
    }),
    { expiresIn: 600 },
  );

  const base = r2.fileUrl.replace(/\/$/, "");
  return { uploadUrl, publicUrl: `${base}/${key}` };
}

export async function uploadProductFile(file: File): Promise<ProductUploadResult> {
  const validationError = validateProductUploadFile(file);
  if (validationError) throw new Error(validationError);

  // 1) Cloudflare R2 — preferowane na produkcji (trwałe, off-site).
  const r2 = getR2Config();
  if (r2) {
    return uploadViaR2(file, r2, "customer-uploads", LARGE_R2_UPLOAD_TIMEOUT_MS);
  }

  // 2) Vercel Blob — alternatywa, gdy R2 nieskonfigurowane.
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (blobToken) {
    return uploadViaVercelBlob(file);
  }

  // 3) Medusa /admin/uploads — fallback (głównie dev). Trwałe tylko gdy
  //    backend ma file-s3 → R2; na file-local pliki są efemeryczne.
  return uploadViaMedusa(file);
}
