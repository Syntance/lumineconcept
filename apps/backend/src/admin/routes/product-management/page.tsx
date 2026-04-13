import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Switch,
  StatusBadge,
  clx,
  Button,
} from "@medusajs/ui"
import { ShoppingBag } from "@medusajs/icons"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { sdk } from "../../lib/sdk"
import { mapProductRows, type ProductRowRaw, type ProductRowUI } from "../../lib/product-management-utils"
import {
  parseCsv,
  productsToCsv,
  downloadCsv,
  columnIndex,
  parsePlnToGrosz,
} from "../../lib/csv-products"

function formatGrToZl(grosz: number): string {
  return (grosz / 100).toFixed(2).replace(".", ",")
}

function parseZlToGr(input: string): number | null {
  const cleaned = input.replace(/\s/g, "").replace(",", ".")
  const n = parseFloat(cleaned)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

const FIELDS = "+metadata,+thumbnail,*categories,*variants,*variants.prices,*images"

type FilterStatus = "all" | "published" | "draft"
type FilterPrice = "all" | "with" | "without"
type SortKey = "title" | "price" | "variants" | "status"

const ProductManagementPage = () => {
  const [products, setProducts] = useState<ProductRowUI[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [filterPrice, setFilterPrice] = useState<FilterPrice>("all")
  const [filterCategory, setFilterCategory] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("title")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProducts = useCallback(async () => {
    try {
      const fields = encodeURIComponent(FIELDS)
      const res = await sdk.client.fetch<{ products: ProductRowRaw[] }>(
        `/admin/products?fields=${fields}&limit=500&order=title`,
        { method: "GET" },
      )
      setProducts(mapProductRows(res.products ?? []))
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const categoryOptions = useMemo(() => {
    const s = new Set<string>()
    for (const p of products) {
      for (const c of p.categories) s.add(c.name)
    }
    return [...s].sort((a, b) => a.localeCompare(b, "pl"))
  }, [products])

  const displayed = useMemo(() => {
    let list = [...products]
    if (filterStatus !== "all") {
      list = list.filter((p) => p.status === filterStatus)
    }
    if (filterPrice === "with") {
      list = list.filter(
        (p) => typeof p.display_price_grosz === "number" && p.display_price_grosz > 0,
      )
    }
    if (filterPrice === "without") {
      list = list.filter(
        (p) =>
          p.display_price_grosz == null || p.display_price_grosz <= 0,
      )
    }
    if (filterCategory) {
      list = list.filter((p) =>
        p.categories.some((c) => c.name === filterCategory),
      )
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.categories.some((c) => c.name.toLowerCase().includes(q)),
      )
    }
    const dir = sortDir === "asc" ? 1 : -1
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title, "pl", { sensitivity: "base" })
          break
        case "price": {
          const pa = a.display_price_grosz ?? 0
          const pb = b.display_price_grosz ?? 0
          cmp = pa - pb
          break
        }
        case "variants":
          cmp = a.variantCount - b.variantCount
          break
        case "status":
          cmp = a.status.localeCompare(b.status)
          break
        default:
          cmp = 0
      }
      return cmp * dir
    })
    return list
  }, [
    products,
    filterStatus,
    filterPrice,
    filterCategory,
    search,
    sortKey,
    sortDir,
  ])

  const toggleVisibility = async (product: ProductRowUI) => {
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

  const startEdit = (product: ProductRowUI) => {
    const g = product.display_price_grosz
    setEditValue(g && g > 0 ? formatGrToZl(g) : "")
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

  const handleExportCsv = () => {
    const rows = displayed.map((p) => ({
      id: p.id,
      tytul: p.title,
      status: p.status,
      kategorie: p.categories.map((c) => c.name).join("; "),
      cena_pln:
        p.display_price_grosz && p.display_price_grosz > 0
          ? (p.display_price_grosz / 100).toFixed(2).replace(".", ",")
          : "",
      warianty: String(p.variantCount),
      widocznosc: p.status === "published" ? "tak" : "nie",
    }))
    const csv = productsToCsv(rows)
    const name = `produkty-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(name, csv)
  }

  const handleImportFile = async (file: File | null) => {
    if (!file) return
    setImporting(true)
    setImportMsg(null)
    try {
      const text = (await file.text()).replace(/^\uFEFF/, "")
      const table = parseCsv(text)
      if (table.length < 2) {
        setImportMsg("Plik CSV jest pusty lub nieprawidłowy.")
        return
      }
      const header = table[0]!.map((h) => h.trim())
      const idCol = columnIndex(header, ["id", "product_id", "product id"])
      if (idCol < 0) {
        setImportMsg("Brak kolumny id (wymagane: id).")
        return
      }
      const statusCol = columnIndex(header, ["status", "widocznosc", "stan"])
      const priceCol = columnIndex(header, [
        "cena_pln",
        "cena",
        "price",
        "price_pln",
        "base_price_pln",
      ])

      let ok = 0
      let err = 0
      for (let r = 1; r < table.length; r++) {
        const row = table[r]!
        const id = (row[idCol] ?? "").trim()
        if (!id || !id.startsWith("prod_")) {
          err++
          continue
        }
        try {
          if (statusCol >= 0) {
            const raw = (row[statusCol] ?? "").trim().toLowerCase()
            if (raw === "published" || raw === "widoczny" || raw === "tak") {
              await sdk.client.fetch(`/admin/products/${id}`, {
                method: "POST",
                body: { status: "published" },
              })
            } else if (
              raw === "draft" ||
              raw === "ukryty" ||
              raw === "nie"
            ) {
              await sdk.client.fetch(`/admin/products/${id}`, {
                method: "POST",
                body: { status: "draft" },
              })
            }
          }
          if (priceCol >= 0) {
            const grosz = parsePlnToGrosz(row[priceCol] ?? "")
            if (grosz !== null && grosz > 0) {
              await sdk.client.fetch(`/admin/products/${id}/base-price`, {
                method: "POST",
                body: { base_price: grosz },
              })
            } else if ((row[priceCol] ?? "").trim() === "") {
              /* puste — pomijamy */
            }
          }
          ok++
        } catch {
          err++
        }
      }
      setImportMsg(`Import zakończony: ${ok} wierszy OK, ${err} błędów.`)
      await fetchProducts()
    } catch {
      setImportMsg("Nie udało się odczytać pliku.")
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const publishedCount = products.filter(
    (p) => p.status === "published",
  ).length
  const pricedCount = products.filter(
    (p) => typeof p.display_price_grosz === "number" && p.display_price_grosz > 0,
  ).length

  if (loading) {
    return (
      <Container className="flex h-64 items-center justify-center">
        <Text className="text-ui-fg-muted">Ładowanie produktów…</Text>
      </Container>
    )
  }

  const selectClass =
    "rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1.5 text-sm text-ui-fg-base focus:border-ui-border-interactive focus:outline-none"

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Heading level="h1">Zarządzanie produktami</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {pricedCount}/{products.length} z ceną · {publishedCount} widocznych
            {" · "}
            w tabeli: {displayed.length} (po filtrach)
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="secondary"
            size="small"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? "Import…" : "Importuj CSV"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleExportCsv}
            disabled={displayed.length === 0}
          >
            Eksportuj CSV
          </Button>
          <Button
            type="button"
            variant="primary"
            size="small"
            onClick={() => {
              window.location.href = "/app/products/create"
            }}
          >
            Nowy produkt
          </Button>
        </div>
      </div>

      {importMsg && (
        <div className="border-b border-ui-border-base px-6 py-2">
          <Text
            size="small"
            className={
              /brak|nie udało|nieprawidłowy|pusty/i.test(importMsg)
                ? "text-ui-fg-error"
                : "text-ui-fg-subtle"
            }
          >
            {importMsg}
          </Text>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 border-b border-ui-border-base px-6 py-3">
        <div className="flex flex-col gap-1">
          <Text size="xsmall" className="text-ui-fg-muted">
            Szukaj
          </Text>
          <input
            type="text"
            placeholder="Tytuł lub kategoria…"
            className="w-52 rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm placeholder:text-ui-fg-muted focus:border-ui-border-interactive focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Text size="xsmall" className="text-ui-fg-muted">
            Status
          </Text>
          <select
            className={selectClass}
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as FilterStatus)
            }
          >
            <option value="all">Wszystkie</option>
            <option value="published">Widoczne</option>
            <option value="draft">Szkice</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Text size="xsmall" className="text-ui-fg-muted">
            Cena
          </Text>
          <select
            className={selectClass}
            value={filterPrice}
            onChange={(e) =>
              setFilterPrice(e.target.value as FilterPrice)
            }
          >
            <option value="all">Dowolna</option>
            <option value="with">Z ceną</option>
            <option value="without">Bez ceny</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Text size="xsmall" className="text-ui-fg-muted">
            Kategoria
          </Text>
          <select
            className={`${selectClass} min-w-[10rem]`}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Wszystkie</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Text size="xsmall" className="text-ui-fg-muted">
            Sortuj
          </Text>
          <div className="flex gap-1">
            <select
              className={selectClass}
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="title">Tytuł</option>
              <option value="price">Cena</option>
              <option value="variants">Warianty</option>
              <option value="status">Status</option>
            </select>
            <select
              className={selectClass}
              value={sortDir}
              onChange={(e) =>
                setSortDir(e.target.value as "asc" | "desc")
              }
            >
              <option value="asc">Rosnąco</option>
              <option value="desc">Malejąco</option>
            </select>
          </div>
        </div>
      </div>

      <Text size="xsmall" className="text-ui-fg-muted px-6 py-2">
        Eksport CSV dotyczy wierszy widocznych poniżej (po filtrach i
        sortowaniu). Import: kolumna{" "}
        <code className="text-ui-fg-subtle">id</code> (prod_…), opcjonalnie{" "}
        <code className="text-ui-fg-subtle">status</code> (published/draft) i{" "}
        <code className="text-ui-fg-subtle">cena_pln</code> (np. 99,90).
      </Text>

      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-ui-bg-subtle">
            <tr className="border-y border-ui-border-base">
              <th className="px-4 py-2.5 text-left font-medium text-ui-fg-subtle">
                Produkt
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-ui-fg-subtle">
                Kategoria
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-ui-fg-subtle">
                Cena (zł)
              </th>
              <th className="px-4 py-2.5 text-center font-medium text-ui-fg-subtle">
                Warianty
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-ui-fg-subtle">
                Widoczność
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border-base">
            {displayed.map((product) => {
              const isPublished = product.status === "published"
              const priceGr = product.display_price_grosz
              const hasPrice = typeof priceGr === "number" && priceGr > 0
              const isEditing = editingId === product.id

              return (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-ui-bg-subtle-hover"
                >
                  <td className="px-4 py-2.5">
                    <a
                      href={`/app/products/${product.id}`}
                      className="flex items-center gap-2.5 no-underline"
                    >
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded object-cover bg-ui-bg-subtle"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-ui-bg-subtle text-[10px] text-ui-fg-muted">
                          —
                        </span>
                      )}
                      <span className="max-w-[260px] truncate font-medium text-ui-fg-base hover:text-ui-fg-interactive">
                        {product.title}
                      </span>
                    </a>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-2.5 text-ui-fg-subtle">
                    {product.categories.length
                      ? product.categories.map((c) => c.name).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
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
                  <td className="px-4 py-2.5 text-center text-ui-fg-subtle">
                    {product.variantCount}
                  </td>
                  <td className="px-4 py-2.5">
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

      {displayed.length === 0 && (
        <div className="flex h-24 items-center justify-center border-t border-ui-border-base">
          <Text size="small" className="text-ui-fg-muted">
            {search ||
            filterStatus !== "all" ||
            filterPrice !== "all" ||
            filterCategory
              ? "Brak wyników — zmień filtry"
              : "Brak produktów"}
          </Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Zarządzanie produktami",
  icon: ShoppingBag,
})

export default ProductManagementPage
