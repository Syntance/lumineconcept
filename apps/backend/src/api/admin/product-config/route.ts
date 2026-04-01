import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type ProductConfigService from "../../../modules/product-config/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("product_config") as ProductConfigService
  const { type } = req.query as { type?: string }

  const filters: Record<string, unknown> = {}
  if (type) filters.type = type

  const options = await service.listConfigOptions(filters, {
    order: { sort_order: "ASC", name: "ASC" },
  })

  res.json({ config_options: options })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("product_config") as ProductConfigService
  const body = req.body as {
    type: string
    name: string
    hex_color?: string | null
    color_category?: string | null
    mat_allowed?: boolean
    sort_order?: number
    metadata?: Record<string, unknown> | null
  }

  if (!body.type || !body.name) {
    return res.status(400).json({ message: "type and name are required" })
  }

  const option = await service.createConfigOptions({
    type: body.type,
    name: body.name,
    hex_color: body.hex_color ?? null,
    color_category: body.color_category ?? null,
    mat_allowed: body.mat_allowed ?? true,
    sort_order: body.sort_order ?? 0,
    metadata: body.metadata ?? null,
  })

  res.status(201).json({ config_option: option })
}
