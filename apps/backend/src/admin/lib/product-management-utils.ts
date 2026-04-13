export interface ProductRowLike {
  id: string
  title: string
  thumbnail: string | null
  status: string
  categories?: Array<{ id: string; name: string }>
  variants?: Array<{
    id: string
    prices?: Array<{ amount?: unknown }>
  }>
  metadata?: Record<string, unknown> | null
  display_price_grosz?: number | null
}

export function minVariantGrosz(
  variants: Array<{ prices?: Array<{ amount?: unknown }> }> | undefined,
): number {
  if (!variants?.length) return 0
  const amounts: number[] = []
  for (const v of variants) {
    for (const pr of v.prices ?? []) {
      const n = Number(pr.amount ?? 0)
      if (Number.isFinite(n) && n > 0) amounts.push(n)
    }
  }
  return amounts.length > 0 ? Math.min(...amounts) : 0
}

export function enrichFromLegacyProducts(
  raw: ProductRowLike[],
): ProductRowLike[] {
  return raw.map((p) => {
    const meta = (p.metadata ?? {}) as Record<string, unknown>
    const minV = minVariantGrosz(p.variants)
    const baseNum = Number(meta.base_price)
    const basePrice =
      Number.isFinite(baseNum) && baseNum > 0 ? baseNum : null
    const displayGrosz = minV > 0 ? minV : basePrice ?? 0
    return {
      ...p,
      display_price_grosz:
        displayGrosz > 0 && Number.isFinite(displayGrosz)
          ? Math.round(displayGrosz)
          : null,
    }
  })
}
