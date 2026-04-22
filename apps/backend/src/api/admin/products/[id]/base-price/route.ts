import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService: IProductModuleService =
    req.scope.resolve(Modules.PRODUCT)
  // Medusa gwarantuje segment `[id]` przy dopasowaniu route'a — z włączonym
  // `noUncheckedIndexedAccess` TS traktuje go jako `string | undefined`,
  // więc zawężamy lokalnie.
  const { id } = req.params as { id: string }
  const product = await productService.retrieveProduct(id)
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
  const { id } = req.params as { id: string }

  const product = await productService.retrieveProduct(id)
  const existingMeta = ((product as any).metadata ?? {}) as Record<
    string,
    unknown
  >

  // Medusa v2: przechowujemy kwotę jako dziesiętne w PLN (spójnie z pricing
  // module i storefrontem po migracji cen). Zaokrąglamy do groszy (2 m.p.)
  // żeby nie wpuścić floating-point artifactu do bazy.
  const raw =
    typeof body.base_price === "number" && Number.isFinite(body.base_price)
      ? body.base_price
      : null
  const price = raw !== null && raw > 0 ? Math.round(raw * 100) / 100 : null

  await productService.updateProducts(id, {
    metadata: {
      ...existingMeta,
      base_price: price !== null ? String(price) : "",
    },
  })

  res.json({ base_price: price })
}
