import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const product = await productService.retrieveProduct(req.params.id)
  const meta = (product as any).metadata ?? {}

  res.json({
    uploads_enabled: meta.uploads_enabled === "true" || meta.uploads_enabled === true,
    uploads_count: Number(meta.uploads_count) || 5,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const body = req.body as {
    uploads_enabled?: boolean
    uploads_count?: number
  }

  const product = await productService.retrieveProduct(req.params.id)
  const existingMeta = ((product as any).metadata ?? {}) as Record<
    string,
    unknown
  >

  const enabled = !!body.uploads_enabled
  const count =
    typeof body.uploads_count === "number" && body.uploads_count >= 1
      ? Math.min(body.uploads_count, 5)
      : Number(existingMeta.uploads_count) || 5

  await productService.updateProducts(req.params.id, {
    metadata: {
      ...existingMeta,
      uploads_enabled: String(enabled),
      uploads_count: String(count),
    },
  })

  res.json({ uploads_enabled: enabled, uploads_count: count })
}
