export interface ProductReviewItem {
  rating: number
  author: string
  text: string
  date?: string
}

const META_KEY = "product_reviews"

export function parseProductReviewsFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ProductReviewItem[] {
  if (!metadata) return []
  const raw = metadata[META_KEY]
  if (typeof raw !== "string" || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: ProductReviewItem[] = []
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue
      const o = item as Record<string, unknown>
      const rating = Math.round(Number(o.rating))
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue
      const author =
        typeof o.author === "string" ? o.author.trim() : ""
      const text = typeof o.text === "string" ? o.text.trim() : ""
      if (!author || !text) continue
      const date =
        typeof o.date === "string" && o.date.trim()
          ? o.date.trim()
          : undefined
      out.push({ rating, author, text, date })
    }
    return out
  } catch {
    return []
  }
}

export function averageRatingFromReviews(
  reviews: ProductReviewItem[],
): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  return sum / reviews.length
}
