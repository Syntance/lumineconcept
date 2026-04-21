import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
  const { productId } = req.params as { productId: string }
  const product = await productService.retrieveProduct(productId)
  const meta = (product as any).metadata ?? {}

  let disabled: string[] = []
  const raw = meta.disabled_config_ids
  if (typeof raw === "string") {
    try {
      disabled = JSON.parse(raw)
    } catch { /* ignore */ }
  } else if (Array.isArray(raw)) {
    disabled = raw
  }

  res.json({ disabled_config_ids: disabled })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
  const body = req.body as { disabled_config_ids?: string[] }
  const disabled = Array.isArray(body.disabled_config_ids) ? body.disabled_config_ids : []

  const { productId } = req.params as { productId: string }
  const product = await productService.retrieveProduct(productId)
  const existingMeta = ((product as any).metadata ?? {}) as Record<string, unknown>

  await productService.updateProducts(productId, {
    metadata: {
      ...existingMeta,
      disabled_config_ids: JSON.stringify(disabled),
    },
  })

  res.json({ disabled_config_ids: disabled })
}
