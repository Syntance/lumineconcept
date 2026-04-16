import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  Label,
  Input,
  IconButton,
  clx,
} from "@medusajs/ui"
import { PlusMini, Trash } from "@medusajs/icons"
import { useCallback, useEffect, useState } from "react"
import { sdk } from "../lib/sdk"

type ReviewRow = {
  rating: number
  author: string
  text: string
  date: string
}

const emptyRow = (): ReviewRow => ({
  rating: 5,
  author: "",
  text: "",
  date: "",
})

const ProductReviewsWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    sdk.client
      .fetch<{ reviews: ReviewRow[] }>(`/admin/products/${product.id}/reviews`, {
        method: "GET",
      })
      .then((res) =>
        setReviews(
          res.reviews?.length
            ? res.reviews.map((r) => ({
                rating: r.rating,
                author: r.author,
                text: r.text,
                date: r.date ?? "",
              }))
            : [],
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [product.id])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const payload = reviews
        .map((r) => ({
          rating: Math.min(5, Math.max(1, Math.round(Number(r.rating)) || 5)),
          author: r.author.trim(),
          text: r.text.trim(),
          date: r.date.trim() || undefined,
        }))
        .filter((r) => r.author && r.text)

      const res = await sdk.client.fetch<{ reviews: ReviewRow[] }>(
        `/admin/products/${product.id}/reviews`,
        { method: "POST", body: { reviews: payload } },
      )
      setReviews(
        res.reviews.map((r) => ({
          rating: r.rating,
          author: r.author,
          text: r.text,
          date: r.date ?? "",
        })),
      )
      setToast("Zapisano opinie")
      setTimeout(() => setToast(null), 2000)
    } catch {
      setToast("Błąd zapisu")
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSaving(false)
    }
  }, [product.id, reviews])

  const addRow = () => setReviews((prev) => [...prev, emptyRow()])

  const removeRow = (index: number) =>
    setReviews((prev) => prev.filter((_, i) => i !== index))

  const updateRow = (index: number, patch: Partial<ReviewRow>) =>
    setReviews((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    )

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <Heading level="h2">Opinie na stronie produktu</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-0.5">
              Wyświetlane pod produktem w sklepie (średnia z ocen + lista).
            </Text>
          </div>
          {toast && (
            <Text
              size="small"
              className={clx(
                "shrink-0",
                toast.startsWith("Błąd")
                  ? "text-ui-fg-error"
                  : "text-ui-fg-interactive",
              )}
            >
              {toast}
            </Text>
          )}
        </div>

        <div className="mt-4 space-y-4">
          {reviews.length === 0 && (
            <Text size="small" className="text-ui-fg-muted">
              Brak opinii — dodaj pierwszą poniżej.
            </Text>
          )}
          {reviews.map((row, index) => (
            <div
              key={index}
              className="space-y-2 rounded-md border border-ui-border-base p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Label size="xsmall">Ocena 1–5</Label>
                <IconButton
                  type="button"
                  size="small"
                  variant="transparent"
                  onClick={() => removeRow(index)}
                  aria-label="Usuń opinię"
                >
                  <Trash />
                </IconButton>
              </div>
              <Input
                size="small"
                type="number"
                min={1}
                max={5}
                className="w-20"
                value={String(row.rating)}
                onChange={(e) =>
                  updateRow(index, {
                    rating: Math.min(
                      5,
                      Math.max(1, parseInt(e.target.value, 10) || 5),
                    ),
                  })
                }
              />
              <div>
                <Label size="xsmall" className="mb-1">
                  Autor / imię
                </Label>
                <Input
                  size="small"
                  value={row.author}
                  onChange={(e) => updateRow(index, { author: e.target.value })}
                  placeholder="np. Anna"
                />
              </div>
              <div>
                <Label size="xsmall" className="mb-1">
                  Treść opinii
                </Label>
                <textarea
                  className="focus:border-ui-border-interactive w-full rounded border border-ui-border-base bg-ui-bg-field px-2 py-1.5 text-sm outline-none"
                  rows={3}
                  value={row.text}
                  onChange={(e) => updateRow(index, { text: e.target.value })}
                  placeholder="Treść wyświetlana przy produkcie…"
                />
              </div>
              <div>
                <Label size="xsmall" className="mb-1">
                  Data (opcjonalnie)
                </Label>
                <Input
                  size="small"
                  value={row.date}
                  onChange={(e) => updateRow(index, { date: e.target.value })}
                  placeholder="np. 2025-03-01"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={addRow}
          >
            <PlusMini />
            Dodaj opinię
          </Button>
          <Button
            type="button"
            size="small"
            onClick={save}
            isLoading={saving}
          >
            Zapisz
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductReviewsWidget
