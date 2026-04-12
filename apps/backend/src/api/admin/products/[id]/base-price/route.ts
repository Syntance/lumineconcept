import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const product = await productService.retrieveProduct(req.params.id)
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

  const product = await productService.retrieveProduct(req.params.id)
  const existingMeta = ((product as any).metadata ?? {}) as Record<
    string,
    unknown
  >

  const price =
    typeof body.base_price === "number" && Number.isFinite(body.base_price) && body.base_price > 0
      ? body.base_price
      : null

  await productService.updateProducts(req.params.id, {
    metadata: {
      ...existingMeta,
      base_price: price !== null ? String(price) : "",
    },
  })

  res.json({ base_price: price })
}
