import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  // Medusa gwarantuje segment `[id]` przy dopasowaniu route'a — z włączonym
  // `noUncheckedIndexedAccess` TS traktuje go jako `string | undefined`,
  // więc zawężamy lokalnie.
  const { id } = req.params as { id: string }
  const product = await productService.retrieveProduct(id)
  const meta = (product as any).metadata ?? {}

  const raw = meta.base_price
  const value = typeof raw === "string" ? Number(raw) : Number(raw)

  res.json({
    base_price: Number.isFinite(value) && value > 0 ? value : null,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const body = req.body as { base_price?: number | null }
  const { id } = req.params as { id: string }

  const product = await productService.retrieveProduct(id)
  const existingMeta = ((product as any).metadata ?? {}) as Record<
    string,
    unknown
  >

  const price =
    typeof body.base_price === "number" && Number.isFinite(body.base_price) && body.base_price > 0
      ? body.base_price
      : null

  await productService.updateProducts(id, {
    metadata: {
      ...existingMeta,
      base_price: price !== null ? String(price) : "",
    },
  })

  res.json({ base_price: price })
}
