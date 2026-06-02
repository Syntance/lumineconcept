import "server-only";
import { put } from "@vercel/blob";

const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/postscript",
]);

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
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
  const email = process.env.MEDUSA_ADMIN_EMAIL?.trim();
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  const base = medusaBackendUrl();
  if (!email || !password || !base) return null;

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
    signal: AbortSignal.timeout(30_000),
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

export function validateProductUploadFile(file: File): string | null {
  if (file.size > MAX_SIZE) {
    return "Plik jest za duży (maks. 10 MB)";
  }
  if (!inferMimeType(file)) {
    return "Niedozwolony typ pliku (PNG, JPG, WEBP, SVG, PDF, AI, EPS)";
  }
  return null;
}

export async function uploadProductFile(file: File): Promise<ProductUploadResult> {
  const validationError = validateProductUploadFile(file);
  if (validationError) throw new Error(validationError);

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (blobToken) {
    return uploadViaVercelBlob(file);
  }

  return uploadViaMedusa(file);
}
