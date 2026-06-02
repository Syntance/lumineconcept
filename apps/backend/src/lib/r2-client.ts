import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

/**
 * Klient R2 (Cloudflare, S3-compatible) do off-site backupów danych.
 *
 * Świadomie NIE współdzielimy klienta z modułem `file-s3` Medusy — ten służy
 * tylko zadaniom backupowym (eksport produktów/zamówień jako JSON). Gdy ENV R2
 * nie są ustawione, `getR2Client()` zwraca null i backup jest no-opem.
 */

let cached: S3Client | null = null

export function r2Bucket(): string | null {
  return process.env.S3_BUCKET?.trim() || null
}

export function getR2Client(): S3Client | null {
  const endpoint = process.env.S3_ENDPOINT?.trim()
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim()
  const bucket = r2Bucket()

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return null
  }

  if (cached) return cached

  cached = new S3Client({
    region: process.env.S3_REGION?.trim() || "auto",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })
  return cached
}

/** Zapisuje obiekt do R2. Rzuca, gdy klient niedostępny — wołający łapie. */
export async function putR2Object(
  key: string,
  body: string | Uint8Array | Buffer,
  contentType = "application/json",
): Promise<void> {
  const client = getR2Client()
  const bucket = r2Bucket()
  if (!client || !bucket) {
    throw new Error("R2 nie jest skonfigurowane (S3_* ENV).")
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}
