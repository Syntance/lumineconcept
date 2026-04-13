/** Prosty parser CSV (obsługa cudzysłowów i przecinka). */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ""
  let inQuotes = false
  const len = content.length
  for (let i = 0; i < len; i++) {
    const c = content[i]!
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < len && content[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ",") {
      current.push(field)
      field = ""
    } else if (c === "\r" || c === "\n") {
      if (c === "\r" && i + 1 < len && content[i + 1] === "\n") i++
      current.push(field)
      field = ""
      if (current.some((cell) => cell.trim() !== "")) rows.push(current)
      current = []
    } else {
      field += c
    }
  }
  current.push(field)
  if (current.some((cell) => cell.trim() !== "")) rows.push(current)
  return rows
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function productsToCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0]!)
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((r) =>
      headers.map((h) => escapeCsvCell(String(r[h] ?? ""))).join(","),
    ),
  ]
  return "\uFEFF" + lines.join("\r\n")
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Znajduje indeks kolumny po nagłówku (bez rozróżniania wielkości liter). */
export function columnIndex(
  headerRow: string[],
  names: string[],
): number {
  const norm = headerRow.map((h) => h.trim().toLowerCase())
  for (const name of names) {
    const i = norm.indexOf(name.toLowerCase())
    if (i >= 0) return i
  }
  return -1
}

export function parsePlnToGrosz(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".")
  if (!cleaned) return null
  const n = parseFloat(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}
