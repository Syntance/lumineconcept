import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type ServerSideEncryption,
  S3Client,
} from "@aws-sdk/client-s3"

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

  // Opcjonalne SSE (np. `AES256`). R2 i tak szyfruje at-rest domyślnie;
  // realna ochrona PII to szyfrowanie klientowe (backup-crypto). Gdy ustawione,
  // dokładamy nagłówek SSE jako defense-in-depth.
  const sse = process.env.S3_SSE?.trim()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(sse ? { ServerSideEncryption: sse as ServerSideEncryption } : {}),
    }),
  )
}

export type R2ObjectInfo = { key: string; lastModified?: Date; size?: number }

/** Lista obiektów R2 pod prefiksem (z paginacją). */
export async function listR2Objects(prefix: string): Promise<R2ObjectInfo[]> {
  const client = getR2Client()
  const bucket = r2Bucket()
  if (!client || !bucket) {
    throw new Error("R2 nie jest skonfigurowane (S3_* ENV).")
  }

  const out: R2ObjectInfo[] = []
  let token: string | undefined
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key) {
        out.push({ key: obj.Key, lastModified: obj.LastModified, size: obj.Size })
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)

  return out
}

/** Usuwa obiekty R2 (paczki po 1000 — limit DeleteObjects). */
export async function deleteR2Objects(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  const client = getR2Client()
  const bucket = r2Bucket()
  if (!client || !bucket) {
    throw new Error("R2 nie jest skonfigurowane (S3_* ENV).")
  }

  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000)
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })) },
      }),
    )
  }
}

/** Pobiera obiekt R2 jako Buffer (np. do restore/weryfikacji). */
export async function getR2Object(key: string): Promise<Buffer> {
  const client = getR2Client()
  const bucket = r2Bucket()
  if (!client || !bucket) {
    throw new Error("R2 nie jest skonfigurowane (S3_* ENV).")
  }

  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const bytes = await res.Body?.transformToByteArray()
  if (!bytes) {
    throw new Error(`Pusty obiekt R2: ${key}`)
  }
  return Buffer.from(bytes)
}
