import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

function parseBooleanMeta(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === "1") return true
  if (value === false || value === 0 || value === "0") return false
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true" || normalized === "yes") return true
    if (normalized === "false" || normalized === "no") return false
  }
  return undefined
}

function metadataHasUploadRequiredKey(meta: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(meta, "uploads_required")
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const { id } = req.params as { id: string }
  const product = await productService.retrieveProduct(id)
  const meta = (product as any).metadata ?? {}
  const enabled = meta.uploads_enabled === "true" || meta.uploads_enabled === true
  const requiredRaw = parseBooleanMeta(meta.uploads_required)

  res.json({
    uploads_enabled: enabled,
    uploads_required: enabled
      ? metadataHasUploadRequiredKey(meta)
        ? (requiredRaw ?? false)
        : true
      : false,
    uploads_count: Number(meta.uploads_count) || 5,
    uploads_label: typeof meta.uploads_label === "string" ? meta.uploads_label : "",
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  const body = req.body as {
    uploads_enabled?: boolean
    uploads_required?: boolean
    uploads_count?: number
    uploads_label?: string
  }

  const { id } = req.params as { id: string }
  const product = await productService.retrieveProduct(id)
  const existingMeta = ((product as any).metadata ?? {}) as Record<
    string,
    unknown
  >

  const enabled = !!body.uploads_enabled
  const existingRequired = parseBooleanMeta(existingMeta.uploads_required)
  const required = enabled
    ? typeof body.uploads_required === "boolean"
      ? body.uploads_required
      : (existingRequired ?? true)
    : false
  const count =
    typeof body.uploads_count === "number" && body.uploads_count >= 1
      ? Math.min(body.uploads_count, 5)
      : Number(existingMeta.uploads_count) || 5
  const label =
    typeof body.uploads_label === "string"
      ? body.uploads_label.trim()
      : (typeof existingMeta.uploads_label === "string" ? existingMeta.uploads_label : "")

  await productService.updateProducts(id, {
    metadata: {
      ...existingMeta,
      uploads_enabled: String(enabled),
      uploads_required: required ? "true" : "false",
      uploads_count: String(count),
      uploads_label: label,
    },
  })

  res.json({
    uploads_enabled: enabled,
    uploads_required: required,
    uploads_count: count,
    uploads_label: label,
  })
}
