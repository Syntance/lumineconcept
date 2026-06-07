import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type ProductConfigService from "../../../modules/product-config/service"

const DEFAULT_COLOR_CATEGORIES = [
  { id: "standard", label: "Standardowe", matDefault: true },
  { id: "color", label: "Kolorowe", matDefault: true },
  { id: "mirror", label: "Lustrzane", matDefault: false },
  { id: "custom", label: "Indywidualny", matDefault: true },
]

function parseColorCategories(raw: unknown): typeof DEFAULT_COLOR_CATEGORIES {
  if (typeof raw === "string" && raw.trim()) {
    try {
      return parseColorCategories(JSON.parse(raw) as unknown)
    } catch {
      return DEFAULT_COLOR_CATEGORIES
    }
  }
  if (!Array.isArray(raw)) return DEFAULT_COLOR_CATEGORIES
  const parsed = raw
    .filter(
      (entry): entry is { id: string; label: string; matDefault?: boolean } =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as { id: string }).id === "string" &&
        typeof (entry as { label: string }).label === "string",
    )
    .map((entry) => ({
      id: entry.id.trim(),
      label: entry.label.trim(),
      matDefault: entry.matDefault !== false,
    }))
    .filter((entry) => entry.id.length > 0 && entry.label.length > 0)
  return parsed.length > 0 ? parsed : DEFAULT_COLOR_CATEGORIES
}

async function loadColorCategories(scope: MedusaRequest["scope"]) {
  try {
    const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
      graph: (args: {
        entity: string
        fields: string[]
        pagination?: { take?: number }
      }) => Promise<{ data: Array<{ metadata?: Record<string, unknown> | null }> }>
    }
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["metadata"],
      pagination: { take: 1 },
    })
    const metadata = (stores[0]?.metadata ?? {}) as Record<string, unknown>
    return parseColorCategories(metadata.magazyn_color_categories)
  } catch {
    return DEFAULT_COLOR_CATEGORIES
  }
}

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

  const color_categories = await loadColorCategories(req.scope)

  if (!product_id) {
    return res.json({ config_options: allOptions, color_categories })
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

  res.json({ config_options: filtered, color_categories })
}
