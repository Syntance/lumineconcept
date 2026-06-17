/** Zgodne z Medusa `admin.maxUploadFileSize` (20 MB). */
export const MAX_CMS_UPLOAD_BYTES = 20 * 1024 * 1024;

export const MAX_CMS_UPLOAD_MB = Math.floor(MAX_CMS_UPLOAD_BYTES / (1024 * 1024));

/** Vercel odrzuca body > ~4.5 MB — większe pliki idą presigned PUT prosto do R2. */
export const VERCEL_SAFE_UPLOAD_BYTES = 4 * 1024 * 1024;

export const VERCEL_SAFE_UPLOAD_MB = Math.floor(VERCEL_SAFE_UPLOAD_BYTES / (1024 * 1024));

/** Zgodne z `serverActions.bodySizeLimit` w next.config (praktyczny limit platformy). */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;