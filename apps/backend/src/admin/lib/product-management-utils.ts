export interface ProductRowRaw {
  id: string
  title: string
  thumbnail: string | null
  status: string
  categories?: Array<{ id: string; name: string }>
  variants?: Array<{
    id: string
    prices?: Array<{ amount?: unknown }>
    calculated_price?: { calculated_amount?: unknown }
  }>
  images?: Array<{ url?: string | null; rank?: number }>
  metadata?: Record<string, unknown> | null
}

export interface ProductRowUI {
  id: string
  title: string
  thumbnail: string | null
  status: string
  categories: Array<{ id: string; name: string }>
  variantCount: number
  metadata: Record<string, unknown>
  display_price_grosz: number | null
}

function minPriceGrosz(
  variants: ProductRowRaw["variants"],
): number {
  if (!variants?.length) return 0
  const amounts: number[] = []
  for (const v of variants) {
    if (v.prices?.length) {
      for (const pr of v.prices) {
        const n = Number(pr.amount ?? 0)
        if (Number.isFinite(n) && n > 0) amounts.push(n)
      }
    }
    const calc = v.calculated_price?.calculated_amount
    if (calc != null) {
      const n = Number(calc)
      if (Number.isFinite(n) && n > 0) amounts.push(n)
    }
  }
  return amounts.length > 0 ? Math.min(...amounts) : 0
}

export function mapProductRows(raw: ProductRowRaw[]): ProductRowUI[] {
  return raw.map((p) => {
    const meta = (p.metadata ?? {}) as Record<string, unknown>
    const minV = minPriceGrosz(p.variants)
    const baseNum = Number(meta.base_price)
    const basePrice =
      Number.isFinite(baseNum) && baseNum > 0 ? baseNum : null
    const displayGrosz = minV > 0 ? minV : basePrice ?? 0

    const sortedImages = [...(p.images ?? [])].sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
    )
    const thumb =
      p.thumbnail ||
      sortedImages.find((im) => im?.url)?.url ||
      null

    return {
      id: p.id,
      title: p.title,
      status: p.status,
      thumbnail: thumb,
      categories:
        p.categories?.map((c) => ({ id: c.id, name: c.name })) ?? [],
      variantCount: p.variants?.length ?? 0,
      metadata: meta,
      display_price_grosz:
        displayGrosz > 0 && Number.isFinite(displayGrosz)
          ? Math.round(displayGrosz)
          : null,
    }
  })
}
