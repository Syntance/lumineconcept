import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Text,
  Switch,
  StatusBadge,
  clx,
} from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { sdk } from "../lib/sdk"

interface ProductRow {
  id: string
  title: string
  thumbnail: string | null
  status: string
  categories?: Array<{ id: string; name: string }>
  variants?: Array<{ id: string }>
  metadata?: Record<string, unknown> | null
  display_price_grosz?: number | null
}

function formatGrToZl(grosz: number): string {
  return (grosz / 100).toFixed(2).replace(".", ",")
}

function parseZlToGr(input: string): number | null {
  const cleaned = input.replace(/\s/g, "").replace(",", ".")
  const n = parseFloat(cleaned)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

const ProductListManagement = () => {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [collapsed, setCollapsed] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await sdk.client.fetch<{ products: ProductRow[] }>(
        `/admin/product-management/products`,
        { method: "GET" },
      )
      setProducts(res.products)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const toggleVisibility = async (product: ProductRow) => {
    const newStatus = product.status === "published" ? "draft" : "published"
    setTogglingId(product.id)
    try {
      await sdk.client.fetch(`/admin/products/${product.id}`, {
        method: "POST",
        body: { status: newStatus },
      })
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, status: newStatus } : p,
        ),
      )
    } catch {
      /* ignore */
    } finally {
      setTogglingId(null)
    }
  }

  const startEdit = (product: ProductRow) => {
    const rawMeta = product.metadata?.base_price
    const nMeta = Number(rawMeta)
    const fromMeta = Number.isFinite(nMeta) && nMeta > 0 ? nMeta : null
    const effective =
      fromMeta ?? (product.display_price_grosz && product.display_price_grosz > 0
        ? product.display_price_grosz
        : null)
    setEditValue(effective ? formatGrToZl(effective) : "")
    setEditingId(product.id)
  }

  const savePrice = async (productId: string) => {
    const grosz = parseZlToGr(editValue.trim())
    try {
      await sdk.client.fetch(
        `/admin/products/${productId}/base-price`,
        { method: "POST", body: { base_price: grosz } },
      )
      await fetchProducts()
    } catch {
      /* ignore */
    }
    setEditingId(null)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.categories?.some((c) => c.name.toLowerCase().includes(q)),
    )
  }, [products, search])

  const publishedCount = products.filter(
    (p) => p.status === "published",
  ).length
  const pricedCount = products.filter((p) => {
    const g = p.display_price_grosz
    return typeof g === "number" && g > 0
  }).length

  if (loading) return null

  return (
    <Container className="p-0">
      <div
        className="flex cursor-pointer select-none items-center justify-between gap-4 px-6 py-3"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ui-fg-base">
            Ceny i widoczność
          </span>
          <Text size="xsmall" className="text-ui-fg-subtle">
            {pricedCount}/{products.length} z ceną · {publishedCount} widocznych
          </Text>
        </div>
        <span className="text-xs text-ui-fg-muted">
          {collapsed ? "▸ Rozwiń" : "▾ Zwiń"}
        </span>
      </div>

      {!collapsed && (
        <>
          {products.length > 10 && (
            <div className="border-t border-ui-border-base px-6 py-2.5">
              <input
                type="text"
                placeholder="Szukaj produktu…"
                className="w-full max-w-xs rounded border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm placeholder:text-ui-fg-muted focus:border-ui-border-interactive focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-ui-bg-subtle">
                <tr className="border-y border-ui-border-base">
                  <th className="px-4 py-2 text-left font-medium text-ui-fg-subtle">
                    Produkt
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-ui-fg-subtle">
                    Kategoria
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-ui-fg-subtle">
                    Cena (zł)
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-ui-fg-subtle">
                    Warianty
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-ui-fg-subtle">
                    Widoczność
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border-base">
                {filtered.map((product) => {
                  const isPublished = product.status === "published"
                  const priceGr = product.display_price_grosz ?? null
                  const hasPrice =
                    typeof priceGr === "number" && priceGr > 0
                  const isEditing = editingId === product.id

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-ui-bg-subtle-hover"
                    >
                      <td className="px-4 py-2">
                        <a
                          href={`/app/products/${product.id}`}
                          className="flex items-center gap-2 no-underline"
                        >
                          {product.thumbnail ? (
                            <img
                              src={product.thumbnail}
                              alt=""
                              className="h-7 w-7 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-ui-bg-subtle text-[9px] text-ui-fg-muted">
                              —
                            </span>
                          )}
                          <span className="max-w-[220px] truncate font-medium text-ui-fg-base hover:text-ui-fg-interactive">
                            {product.title}
                          </span>
                        </a>
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-2 text-ui-fg-subtle">
                        {product.categories?.length
                          ? product.categories.map((c) => c.name).join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            inputMode="decimal"
                            className="w-24 rounded border border-ui-border-interactive bg-ui-bg-field px-2 py-1 text-right text-sm focus:outline-none"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => savePrice(product.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                (e.target as HTMLInputElement).blur()
                              if (e.key === "Escape") setEditingId(null)
                            }}
                            placeholder="0,00"
                          />
                        ) : (
                          <button
                            type="button"
                            className={clx(
                              "rounded px-2 py-0.5 text-sm tabular-nums transition-colors",
                              hasPrice
                                ? "font-medium text-ui-fg-base hover:bg-ui-bg-subtle"
                                : "italic text-ui-fg-muted hover:bg-ui-bg-subtle hover:text-ui-fg-base",
                            )}
                            onClick={() => startEdit(product)}
                            title="Kliknij aby edytować cenę"
                          >
                            {hasPrice && priceGr != null
                              ? formatGrToZl(priceGr) + " zł"
                              : "Ustaw cenę"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center text-ui-fg-subtle">
                        {product.variants?.length ?? 0}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isPublished}
                            onCheckedChange={() => toggleVisibility(product)}
                            disabled={togglingId === product.id}
                          />
                          <StatusBadge
                            color={isPublished ? "green" : "grey"}
                          >
                            {isPublished ? "Widoczny" : "Ukryty"}
                          </StatusBadge>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex h-20 items-center justify-center border-t border-ui-border-base">
              <Text size="small" className="text-ui-fg-muted">
                {search ? "Brak wyników" : "Brak produktów"}
              </Text>
            </div>
          )}
        </>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default ProductListManagement
