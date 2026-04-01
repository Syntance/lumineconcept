import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type ProductConfigService from "../../../../modules/product-config/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("product_config") as ProductConfigService
  const { id } = req.params
  const body = req.body as {
    type?: string
    name?: string
    hex_color?: string | null
    color_category?: string | null
    mat_allowed?: boolean
    sort_order?: number
    metadata?: Record<string, unknown> | null
  }

  const option = await service.updateConfigOptions(id, body)
  res.json({ config_option: option })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("product_config") as ProductConfigService
  const { id } = req.params

  await service.deleteConfigOptions(id)
  res.json({ id, deleted: true })
}
