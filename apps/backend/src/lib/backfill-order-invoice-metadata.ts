import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, remoteQueryObjectFromString } from "@medusajs/framework/utils";
import { persistOrderCheckoutMetadata } from "./order-checkout-metadata";

type OrderRow = {
  id: string;
  display_id?: number | null;
  metadata?: Record<string, unknown> | null;
  billing_address?: { company?: string | null } | null;
};

function metaString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

/** Czysta logika patcha — testowalna bez Medusa container. */
export function buildInvoiceMetadataPatch(input: {
  metadata?: Record<string, unknown> | null;
  billingCompany?: string | null;
}): Record<string, string> {
  const meta = input.metadata ?? {};
  const existingCompany = metaString(meta, "companyName");
  const existingNip = metaString(meta, "nip");
  const existingInvoice = metaString(meta, "invoice");
  const billingCompany = input.billingCompany?.trim() ?? "";

  const patch: Record<string, string> = {};

  if (!existingCompany && billingCompany) {
    patch.companyName = billingCompany;
  }

  const willHaveCompany = existingCompany || patch.companyName || billingCompany;
  const willHaveNip = Boolean(existingNip);
  const wantsInvoice = Boolean(willHaveCompany || willHaveNip);

  if (wantsInvoice && !existingInvoice) {
    patch.invoice = "tak";
  }

  return patch;
}

/**
 * Uzupełnia metadata faktury z danych już zapisanych w zamówieniu.
 *
 * Historycznie checkout zbierał NIP i firmę w formularzu, ale:
 * - nazwa firmy trafiała tylko do `billing_address.company` (krok 1),
 * - NIP nie był zapisywany nigdzie po stronie serwera.
 *
 * Backfill kopiuje firmę z adresu rozliczeniowego → metadata.companyName
 * i ustawia metadata.invoice = "tak". NIP można uzupełnić tylko jeśli już
 * istnieje w metadata (np. zamówienia ręczne z Magazynu).
 */
export async function backfillOrderInvoiceMetadata(
  scope: MedusaContainer,
  options?: { dryRun?: boolean; limit?: number },
): Promise<{
  total: number;
  patched: number;
  skipped: number;
  failed: number;
  samples: Array<{ displayId: number | null; patch: Record<string, string> }>;
}> {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const take = options?.limit ?? 10_000;

  const orderObject = remoteQueryObjectFromString({
    entryPoint: "order",
    variables: { filters: {} },
    fields: ["id", "display_id", "metadata", "billing_address.company"],
    pagination: { take, order: { created_at: "DESC" } },
  });
  const rows = await remoteQuery(orderObject);
  const orders = (Array.isArray(rows) ? rows : rows ? [rows] : []) as OrderRow[];
  const stats = {
    total: orders.length,
    patched: 0,
    skipped: 0,
    failed: 0,
    samples: [] as Array<{ displayId: number | null; patch: Record<string, string> }>,
  };

  for (const order of orders) {
    try {
      const patch = buildInvoiceMetadataPatch({
        metadata: order.metadata,
        billingCompany: order.billing_address?.company,
      });

      if (Object.keys(patch).length === 0) {
        stats.skipped++;
        continue;
      }

      if (options?.dryRun) {
        stats.patched++;
        if (stats.samples.length < 20) {
          stats.samples.push({ displayId: order.display_id ?? null, patch });
        }
        continue;
      }

      await persistOrderCheckoutMetadata(scope, order.id, patch);
      stats.patched++;
      if (stats.samples.length < 20) {
        stats.samples.push({ displayId: order.display_id ?? null, patch });
      }
    } catch {
      stats.failed++;
    }
  }

  return stats;
}
