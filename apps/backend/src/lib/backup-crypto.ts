import crypto from "node:crypto"

/**
 * Szyfrowanie backupów po stronie klienta (AES-256-GCM) PRZED wysłaniem do R2.
 *
 * Backupy zawierają PII zamówień (e-mail, adres, telefon). R2 szyfruje dane „at
 * rest" domyślnie, ale to operator trzyma klucz — kompromitacja bucketa/tokenów
 * = wyciek. Szyfrowanie klientowe sprawia, że bez `BACKUP_ENCRYPTION_KEY` plik
 * jest bezużyteczny, nawet jeśli ktoś wykradnie obiekty z R2.
 *
 * Format pliku zaszyfrowanego: MAGIC(9) | IV(12) | AUTH_TAG(16) | CIPHERTEXT.
 * Gdy klucz nie jest ustawiony → zwracamy plaintext (kompatybilność wsteczna).
 */

const MAGIC = Buffer.from("LUMINEBK1")
const IV_LEN = 12
const TAG_LEN = 16

function getKey(): Buffer | null {
  const raw = process.env.BACKUP_ENCRYPTION_KEY?.trim()
  if (!raw) return null
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64")
  if (key.length !== 32) {
    throw new Error(
      "BACKUP_ENCRYPTION_KEY musi dawać 32 bajty (hex 64 znaki lub base64 32B).",
    )
  }
  return key
}

export function backupEncryptionEnabled(): boolean {
  return Boolean(process.env.BACKUP_ENCRYPTION_KEY?.trim())
}

export type EncodedBackup = {
  body: Buffer
  encrypted: boolean
  /** Rozszerzenie pliku: `json` (plain) lub `json.enc` (zaszyfrowany). */
  ext: string
  contentType: string
}

/** Szyfruje payload, jeśli ustawiono klucz; inaczej zwraca plaintext jako Buffer. */
export function encodeBackup(plaintext: string): EncodedBackup {
  const key = getKey()
  if (!key) {
    return {
      body: Buffer.from(plaintext, "utf8"),
      encrypted: false,
      ext: "json",
      contentType: "application/json",
    }
  }
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    body: Buffer.concat([MAGIC, iv, tag, ciphertext]),
    encrypted: true,
    ext: "json.enc",
    contentType: "application/octet-stream",
  }
}

/** Odszyfrowuje plik backupu. Plik bez nagłówka MAGIC traktujemy jako plaintext. */
export function decodeBackup(buf: Buffer): string {
  const isEncrypted =
    buf.length >= MAGIC.length && buf.subarray(0, MAGIC.length).equals(MAGIC)
  if (!isEncrypted) {
    return buf.toString("utf8")
  }
  const key = getKey()
  if (!key) {
    throw new Error(
      "Plik backupu jest zaszyfrowany — ustaw BACKUP_ENCRYPTION_KEY, aby odczytać.",
    )
  }
  const iv = buf.subarray(MAGIC.length, MAGIC.length + IV_LEN)
  const tag = buf.subarray(MAGIC.length + IV_LEN, MAGIC.length + IV_LEN + TAG_LEN)
  const ciphertext = buf.subarray(MAGIC.length + IV_LEN + TAG_LEN)
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}
