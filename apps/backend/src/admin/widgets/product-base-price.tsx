import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Input,
  Label,
  clx,
} from "@medusajs/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import { sdk } from "../lib/sdk"

function formatGroszToZl(grosz: number): string {
  return (grosz / 100).toFixed(2).replace(".", ",")
}

function parseZlToGrosz(input: string): number | null {
  const cleaned = input.replace(/\s/g, "").replace(",", ".")
  const n = parseFloat(cleaned)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

const ProductBasePriceWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [priceGrosz, setPriceGrosz] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string, ms = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), ms)
  }

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await sdk.client.fetch<{ base_price: number | null }>(
          `/admin/products/${product.id}/base-price`,
          { method: "GET" },
        )
        if (res.base_price) {
          setPriceGrosz(res.base_price)
          setInputValue(formatGroszToZl(res.base_price))
        } else {
          const fields = encodeURIComponent("*variants,*variants.prices")
          const prodRes = await sdk.client.fetch<{
            product: {
              variants?: Array<{
                prices?: Array<{ amount?: number }>
              }>
            }
          }>(
            `/admin/products/${product.id}?fields=${fields}`,
            { method: "GET" },
          )
          const amounts = (prodRes.product?.variants ?? [])
            .flatMap((v) => (v.prices ?? []).map((p) => Number(p.amount ?? 0)))
            .filter((n) => Number.isFinite(n) && n > 0)
          const minPrice = amounts.length > 0 ? Math.min(...amounts) : null
          setPriceGrosz(minPrice)
          setInputValue(minPrice ? formatGroszToZl(minPrice) : "")
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchPrice()
  }, [product.id])

  const save = useCallback(
    async (value: number | null) => {
      setSaving(true)
      try {
        const res = await sdk.client.fetch<{ base_price: number | null }>(
          `/admin/products/${product.id}/base-price`,
          {
            method: "POST",
            body: { base_price: value },
          },
        )
        setPriceGrosz(res.base_price)
        setInputValue(res.base_price ? formatGroszToZl(res.base_price) : "")
        showToast("Zapisano!")
      } catch {
        showToast("Błąd zapisu", 3000)
      } finally {
        setSaving(false)
      }
    },
    [product.id],
  )

  const handleBlur = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      if (priceGrosz !== null) save(null)
      return
    }
    const parsed = parseZlToGrosz(trimmed)
    if (parsed === null) {
      setInputValue(priceGrosz ? formatGroszToZl(priceGrosz) : "")
      showToast("Nieprawidłowa kwota", 3000)
      return
    }
    if (parsed !== priceGrosz) {
      save(parsed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            Ładowanie…
          </Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h2">Cena bazowa</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-0.5">
              Cena wyświetlana na stronie (w PLN)
            </Text>
          </div>
          {toast && (
            <Text
              size="small"
              className={clx(
                "transition-opacity",
                toast.startsWith("Błąd") || toast.startsWith("Nieprawidłowa")
                  ? "text-ui-fg-error"
                  : "text-ui-fg-interactive",
              )}
            >
              {toast}
            </Text>
          )}
        </div>

        <div className="mt-4">
          <Label size="xsmall" className="mb-1">
            Kwota (zł):
          </Label>
          <div className="flex items-center gap-2">
            <Input
              size="small"
              type="text"
              inputMode="decimal"
              placeholder="np. 149,00"
              className="w-36"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={saving}
            />
            <Text size="small" className="text-ui-fg-muted">
              PLN
            </Text>
          </div>
          <Text size="xsmall" className="text-ui-fg-muted mt-1">
            Puste pole = cena z wariantu. Wartość zapisywana w groszach.
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default ProductBasePriceWidget
