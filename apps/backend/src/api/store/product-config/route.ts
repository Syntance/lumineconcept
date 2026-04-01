import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type ProductConfigService from "../../../modules/product-config/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("product_config") as ProductConfigService
  const { type, product_id } = req.query as {
    type?: string
    product_id?: string
  }

  const filters: Record<string, unknown> = {}
  if (type) filters.type = type

  const allOptions = await service.listConfigOptions(filters, {
    order: { sort_order: "ASC", name: "ASC" },
  })

  if (!product_id) {
    return res.json({ config_options: allOptions })
  }

  const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
  const product = await productService.retrieveProduct(product_id)
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

  const disabledSet = new Set(disabled)
  const filtered = allOptions.filter((o: any) => !disabledSet.has(o.id))

  res.json({ config_options: filtered })
}
