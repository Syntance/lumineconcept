import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const { id } = req.params as { id: string }
  const product = await productService.retrieveProduct(id)
  const raw = (product as any).metadata?.text_fields

  let textFields: unknown[] = []
  if (typeof raw === "string") {
    try { textFields = JSON.parse(raw) } catch { /* ignore */ }
  } else if (Array.isArray(raw)) {
    textFields = raw
  }

  res.json({ text_fields: textFields })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const body = req.body as { text_fields?: unknown[] }
  const textFields = Array.isArray(body.text_fields) ? body.text_fields : []
  const { id } = req.params as { id: string }

  const product = await productService.retrieveProduct(id)
  const existingMeta = ((product as any).metadata ?? {}) as Record<string, unknown>

  await productService.updateProducts(id, {
    metadata: {
      ...existingMeta,
      text_fields: JSON.stringify(textFields),
    },
  })

  res.json({ text_fields: textFields })
}
