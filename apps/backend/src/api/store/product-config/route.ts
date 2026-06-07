import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type ProductConfigService from "../../../modules/product-config/service"

function parseDisabledIds(meta: Record<string, unknown>): string[] {
  const raw = meta.disabled_config_ids
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []
    } catch {
      return []
    }
  }
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string")
  }
  return []
}

function hasPerSlotColorConfig(meta: Record<string, unknown>): boolean {
  const raw = meta.disabled_config_ids_by_slot
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
    } catch {
      return false
    }
  }
  return raw !== null && typeof raw === "object" && !Array.isArray(raw)
}

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
  const meta = ((product as { metadata?: Record<string, unknown> }).metadata ?? {}) as Record<
    string,
    unknown
  >

  const disabled = parseDisabledIds(meta)
  const disabledSet = new Set(disabled)
  const perSlot = hasPerSlotColorConfig(meta)

  const filtered = allOptions.filter((o: { id: string; type: string }) => {
    if (perSlot && o.type === "color") {
      return true
    }
    return !disabledSet.has(o.id)
  })

  res.json({ config_options: filtered })
}
