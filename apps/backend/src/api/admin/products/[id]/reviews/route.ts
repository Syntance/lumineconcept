import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const META_KEY = "product_reviews"
const MAX_REVIEWS = 40

export type ProductReviewDTO = {
  rating: number
  author: string
  text: string
  date?: string
}

function normalizeReviews(input: unknown): ProductReviewDTO[] {
  if (!Array.isArray(input)) return []
  const out: ProductReviewDTO[] = []
  for (const item of input.slice(0, MAX_REVIEWS)) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const rating = Math.round(Number(o.rating))
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue
    const author =
      typeof o.author === "string" ? o.author.trim().slice(0, 120) : ""
    const text = typeof o.text === "string" ? o.text.trim().slice(0, 4000) : ""
    if (!author || !text) continue
    const date =
      typeof o.date === "string" && o.date.trim()
        ? o.date.trim().slice(0, 32)
        : undefined
    out.push({ rating, author, text, date })
  }
  return out
}

function parseStored(meta: Record<string, unknown>): ProductReviewDTO[] {
  const raw = meta[META_KEY]
  if (typeof raw !== "string" || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return normalizeReviews(parsed)
  } catch {
    return []
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const product = await productService.retrieveProduct(req.params.id)
  const meta = ((product as any).metadata ?? {}) as Record<string, unknown>

  res.json({ reviews: parseStored(meta) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const body = req.body as { reviews?: unknown }

  const product = await productService.retrieveProduct(req.params.id)
  const existingMeta = ((product as any).metadata ?? {}) as Record<
    string,
    unknown
  >

  const reviews = normalizeReviews(body.reviews)

  await productService.updateProducts(req.params.id, {
    metadata: {
      ...existingMeta,
      [META_KEY]: reviews.length > 0 ? JSON.stringify(reviews) : "",
    },
  })

  res.json({ reviews })
}
