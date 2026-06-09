import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Switch,
  Label,
  Input,
  clx,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { sdk } from "../lib/sdk"

const ProductUploadsWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [enabled, setEnabled] = useState(false)
  const [required, setRequired] = useState(true)
  const [maxFiles, setMaxFiles] = useState(5)
  const [label, setLabel] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    sdk.client
      .fetch<{
        uploads_enabled: boolean
        uploads_required: boolean
        uploads_count: number
        uploads_label: string
      }>(
        `/admin/products/${product.id}/uploads`,
        { method: "GET" },
      )
      .then((res) => {
        setEnabled(res.uploads_enabled)
        setRequired(res.uploads_required)
        setMaxFiles(res.uploads_count)
        setLabel(res.uploads_label)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [product.id])

  const save = useCallback(
    async (newEnabled: boolean, newRequired: boolean, newCount: number, newLabel: string) => {
      setSaving(true)
      try {
        const res = await sdk.client.fetch<{
          uploads_enabled: boolean
          uploads_required: boolean
          uploads_count: number
          uploads_label: string
        }>(`/admin/products/${product.id}/uploads`, {
          method: "POST",
          body: {
            uploads_enabled: newEnabled,
            uploads_required: newRequired,
            uploads_count: newCount,
            uploads_label: newLabel,
          },
        })
        setEnabled(res.uploads_enabled)
        setRequired(res.uploads_required)
        setMaxFiles(res.uploads_count)
        setLabel(res.uploads_label)
        setToast("Zapisano!")
        setTimeout(() => setToast(null), 2000)
      } catch {
        setToast("Błąd zapisu")
        setTimeout(() => setToast(null), 3000)
      } finally {
        setSaving(false)
      }
    },
    [product.id],
  )

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    save(checked, required, maxFiles, label)
  }

  const handleRequiredToggle = (checked: boolean) => {
    setRequired(checked)
    save(enabled, checked, maxFiles, label)
  }

  const handleCountChange = (value: string) => {
    const n = Math.min(Math.max(parseInt(value) || 1, 1), 5)
    setMaxFiles(n)
  }

  const handleCountBlur = () => {
    save(enabled, required, maxFiles, label)
  }

  const handleLabelBlur = () => {
    save(enabled, required, maxFiles, label)
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
            <Heading level="h2">Upload plików</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-0.5">
              Pozwól klientowi wgrać logo lub elementy graficzne
            </Text>
          </div>
          {toast && (
            <Text
              size="small"
              className={clx(
                "transition-opacity",
                toast.startsWith("Błąd")
                  ? "text-ui-fg-error"
                  : "text-ui-fg-interactive",
              )}
            >
              {toast}
            </Text>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
          <Label size="small">
            {enabled ? "Włączony" : "Wyłączony"}
          </Label>
        </div>

        {enabled && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={required}
                onCheckedChange={handleRequiredToggle}
                disabled={saving}
              />
              <Label size="small">
                {required ? "Wymagane do koszyka" : "Opcjonalne"}
              </Label>
            </div>
            <div>
              <Label size="xsmall" className="mb-1">Nagłówek sekcji (opcjonalnie):</Label>
              <Input
                size="small"
                placeholder="Wgraj swoje logo"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={handleLabelBlur}
                disabled={saving}
              />
              <Text size="xsmall" className="text-ui-fg-muted mt-1">
                Pusty = domyślny: „Wgraj swoje logo”
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Label size="xsmall">Maks. plików (1–5):</Label>
              <Input
                size="small"
                type="number"
                className="w-20"
                min={1}
                max={5}
                value={maxFiles}
                onChange={(e) => handleCountChange(e.target.value)}
                onBlur={handleCountBlur}
                disabled={saving}
              />
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductUploadsWidget
