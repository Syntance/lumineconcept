import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

function minVariantPriceGrosz(variants: unknown[] | undefined): number {
  if (!variants?.length) return 0
  const amounts: number[] = []
  for (const v of variants) {
    const prices = (v as { prices?: Array<{ amount?: unknown }> }).prices
    if (!prices?.length) continue
    for (const pr of prices) {
      const n = Number(pr.amount ?? 0)
      if (Number.isFinite(n) && n > 0) amounts.push(n)
    }
  }
  return amounts.length > 0 ? Math.min(...amounts) : 0
}

function resolveImageUrl(
  req: MedusaRequest,
  url: string | null | undefined,
): string | null {
  if (!url || typeof url !== "string") return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  const base =
    process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
    `${req.protocol ?? "http"}://${req.get("host") ?? "localhost:9000"}`
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`
}

/**
 * GET /admin/product-management/products
 * Lista pod stronę „Zarządzanie produktami”: miniatury (thumbnail lub pierwszy obrazek)
 * oraz cena jak w sklepie — min z cen wariantów, inaczej metadata.base_price.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)

  type ProductListRow = {
    id: string
    title: string
    status: string
    thumbnail: string | null
    metadata?: Record<string, unknown> | null
    categories?: Array<{ id: string; name: string }>
    variants?: Array<{ id: string; prices?: Array<{ amount?: unknown }> }>
    images?: Array<{ url?: string | null }>
  }

  let products: ProductListRow[]
  try {
    products = (await productService.listProducts(
      {},
      {
        relations: ["variants", "variants.prices", "categories", "images"],
        order: { title: "ASC" },
        take: 500,
      },
    )) as ProductListRow[]
  } catch {
    products = (await productService.listProducts(
      {},
      {
        relations: ["variants", "variants.prices", "categories"],
        order: { title: "ASC" },
        take: 500,
      },
    )) as ProductListRow[]
  }

  const rows = products.map((p) => {
    const meta = (p.metadata ?? {}) as Record<string, unknown>
    const minV = minVariantPriceGrosz(p.variants as unknown[] | undefined)
    const baseRaw = meta.base_price
    const baseNum =
      baseRaw !== undefined && baseRaw !== null && baseRaw !== ""
        ? Number(baseRaw)
        : NaN
    const basePrice = Number.isFinite(baseNum) && baseNum > 0 ? baseNum : null

    const displayGrosz = minV > 0 ? minV : basePrice ?? 0

    const rawThumb =
      (p.thumbnail && String(p.thumbnail)) ||
      p.images?.find((im) => im?.url)?.url ||
      p.images?.[0]?.url ||
      null

    return {
      id: p.id,
      title: p.title,
      status: p.status,
      thumbnail: resolveImageUrl(req, rawThumb),
      categories: p.categories?.map((c) => ({ id: c.id, name: c.name })) ?? [],
      variants: p.variants?.map((v) => ({ id: v.id })) ?? [],
      metadata: meta,
      display_price_grosz:
        displayGrosz > 0 && Number.isFinite(displayGrosz)
          ? Math.round(displayGrosz)
          : null,
    }
  })

  res.json({ products: rows })
}
