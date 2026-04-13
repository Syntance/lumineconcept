import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Switch,
  Input,
  StatusBadge,
  clx,
} from "@medusajs/ui"
import { CurrencyDollar } from "@medusajs/icons"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { sdk } from "../../lib/sdk"

interface ProductRow {
  id: string
  title: string
  thumbnail: string | null
  status: string
  categories?: Array<{ id: string; name: string }>
  variants?: Array<{ id: string }>
  metadata?: Record<string, unknown> | null
}

function formatBasePrice(
  meta: Record<string, unknown> | null | undefined,
): string {
  const raw = meta?.base_price
  if (raw === undefined || raw === null || raw === "") return "—"
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return "—"
  return (n / 100).toFixed(2).replace(".", ",") + " zł"
}

const ProductsOverviewPage = () => {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string, ms = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), ms)
  }

  const fetchProducts = useCallback(async () => {
    try {
      const fields = encodeURIComponent("+metadata,*categories")
      const res = await sdk.client.fetch<{
        products: ProductRow[]
        count: number
      }>(`/admin/products?fields=${fields}&limit=200&order=title`, {
        method: "GET",
      })
      setProducts(res.products)
    } catch (e) {
      console.error("Failed to fetch products:", e)
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
      showToast(
        newStatus === "published"
          ? "Produkt widoczny na stronie"
          : "Produkt ukryty",
      )
    } catch (e) {
      console.error("Failed to toggle visibility:", e)
      showToast("Błąd zmiany statusu")
    } finally {
      setTogglingId(null)
    }
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

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex h-48 items-center justify-center">
          <Text size="small" className="text-ui-fg-muted">
            Ładowanie produktów…
          </Text>
        </div>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-0">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <Heading level="h1">Zarządzanie produktami</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              {publishedCount} z {products.length} widocznych na stronie
            </Text>
          </div>
          <div className="flex items-center gap-3">
            {toast && (
              <Text
                size="small"
                className={clx(
                  "transition-opacity whitespace-nowrap",
                  toast.startsWith("Błąd")
                    ? "text-ui-fg-error"
                    : "text-ui-fg-interactive",
                )}
              >
                {toast}
              </Text>
            )}
            <div className="w-56 shrink-0">
              <Input
                size="small"
                type="text"
                placeholder="Szukaj produktu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Container>

      <Container className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ui-border-base">
              <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-ui-fg-subtle">
                Produkt
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-ui-fg-subtle">
                Kategoria
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-ui-fg-subtle">
                Cena
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 text-center font-medium text-ui-fg-subtle">
                Warianty
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-ui-fg-subtle">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border-base">
            {filtered.map((product) => {
              const isPublished = product.status === "published"
              return (
                <tr
                  key={product.id}
                  className="group transition-colors hover:bg-ui-bg-subtle-hover"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/app/products/${product.id}`}
                      className="flex items-center gap-3 no-underline"
                    >
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-ui-bg-subtle text-[10px] text-ui-fg-muted">
                          —
                        </span>
                      )}
                      <span className="font-medium text-ui-fg-base group-hover:text-ui-fg-interactive transition-colors">
                        {product.title}
                      </span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ui-fg-subtle">
                    {product.categories?.length
                      ? product.categories.map((c) => c.name).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-ui-fg-base">
                    {formatBasePrice(product.metadata)}
                  </td>
                  <td className="px-4 py-3 text-center text-ui-fg-subtle">
                    {product.variants?.length ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Switch
                        checked={isPublished}
                        onCheckedChange={() => toggleVisibility(product)}
                        disabled={togglingId === product.id}
                      />
                      <StatusBadge color={isPublished ? "green" : "grey"}>
                        {isPublished ? "Widoczny" : "Ukryty"}
                      </StatusBadge>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex h-32 items-center justify-center">
            <Text size="small" className="text-ui-fg-muted">
              {search ? "Brak wyników wyszukiwania" : "Brak produktów"}
            </Text>
          </div>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Zarządzanie produktami",
  icon: CurrencyDollar,
})

export default ProductsOverviewPage
