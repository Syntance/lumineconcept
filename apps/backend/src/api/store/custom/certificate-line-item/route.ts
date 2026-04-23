import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { addToCartWorkflow } from "@medusajs/medusa/core-flows";

/** Synchronizuj z PDP (`ProductPageClient`) — dopłata za podstawkę w kolorze certyfikatu. */
const CERTIFICATE_STAND_SURCHARGE_PLN = 10;

const CERT_TAG = "certyfikaty";

/** Snapshot koszyka bez joina `region.*` (remoteQuery potrafi go odrzucić). */
const CART_SNAPSHOT_FIELDS = [
  "id",
  "currency_code",
  "region_id",
  "completed_at",
  "total",
  "subtotal",
  "tax_total",
  "shipping_total",
  "metadata",
  "items.id",
  "items.title",
  "items.quantity",
  "items.unit_price",
  "items.total",
  "items.subtotal",
  "items.variant_id",
  "items.thumbnail",
  "items.metadata",
];

type Body = {
  cart_id?: string;
  variant_id?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
};

type VariantGraphRow = {
  id?: string;
  prices?: Array<{ amount?: unknown; currency_code?: string }>;
  product?: {
    metadata?: Record<string, unknown> | null;
    tags?: Array<{ value?: string | null } | null> | null;
  };
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function baseUnitFromVariant(row: VariantGraphRow, currencyCode: string): number {
  const cc = (currencyCode || "pln").toLowerCase();
  const priceRow = row.prices?.find(
    (p) => (p.currency_code || "").toLowerCase() === cc,
  );
  const fromVariant = num(priceRow?.amount);
  if (fromVariant != null && fromVariant > 0) return fromVariant;
  const bp = row.product?.metadata
    ? num(row.product.metadata.base_price)
    : null;
  if (bp != null && bp > 0) return bp;
  return 0;
}

function isCertificateProduct(row: VariantGraphRow): boolean {
  const tags = row.product?.tags ?? [];
  return tags.some(
    (t) => (t?.value || "").toLowerCase().trim() === CERT_TAG,
  );
}

function stringifyMetadata(
  meta: Record<string, unknown> | undefined,
): Record<string, string> {
  if (!meta || typeof meta !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

/**
 * POST /store/custom/certificate-line-item
 *
 * Dodaje pozycję do koszyka z **ustawioną ceną jednostkową** (workflow
 * `addToCartWorkflow`), żeby bezpiecznie doliczyć dopłatę za podstawkę
 * (+10 PLN / szt.) tylko dla produktów oznaczonych tagiem `certyfikaty`.
 *
 * Wymaga `metadata.certificate_stand === "true"` (jak na PDP).
 */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const body = (req.body ?? {}) as Body;
  const cartId = body.cart_id?.trim();
  const variantId = body.variant_id?.trim();
  const quantity = Math.max(1, Math.min(99, Math.floor(Number(body.quantity) || 1)));
  const rawMeta = stringifyMetadata(body.metadata);

  if (!cartId || !variantId) {
    return res.status(400).json({
      message: "cart_id i variant_id są wymagane",
    });
  }

  if (rawMeta.certificate_stand !== "true") {
    return res.status(400).json({
      message: "certificate_line_item wymaga metadata.certificate_stand === \"true\"",
    });
  }

  const scope = req.scope;
  const cartModule = scope.resolve(Modules.CART);
  const carts = await cartModule.listCarts(
    { id: [cartId] },
    {
      select: ["id", "region_id", "currency_code", "completed_at"],
      take: 1,
    },
  );
  const cartRow = carts[0];
  if (!cartRow) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found`);
  }
  if (cartRow.completed_at) {
    return res.status(400).json({ message: "Koszyk jest już zakończony" });
  }

  const currency = (cartRow.currency_code as string) || "pln";
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "prices.amount",
      "prices.currency_code",
      "product.metadata",
      "product.tags.value",
    ],
    filters: { id: variantId },
  });

  const row = variants[0] as VariantGraphRow | undefined;
  if (!row?.id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Variant ${variantId} not found`);
  }

  if (!isCertificateProduct(row)) {
    return res.status(400).json({
      message:
        "Podstawka jest dostępna tylko dla certyfikatów — produkt musi mieć tag „certyfikaty” w Medusie.",
    });
  }

  const baseUnit = baseUnitFromVariant(row, currency);
  if (!(baseUnit > 0)) {
    return res.status(400).json({
      message: "Nie udało się ustalić ceny bazowej wariantu — sprawdź cennik w Medusie.",
    });
  }

  const unitPrice = Math.round((baseUnit + CERTIFICATE_STAND_SURCHARGE_PLN) * 100) / 100;

  const lineMetadata: Record<string, string> = {
    ...rawMeta,
    certificate_stand: "true",
    certificate_stand_pln: String(CERTIFICATE_STAND_SURCHARGE_PLN),
  };

  await addToCartWorkflow(scope).run({
    input: {
      cart_id: cartId,
      items: [
        {
          variant_id: variantId,
          quantity,
          unit_price: unitPrice,
          metadata: lineMetadata,
        },
      ],
    },
  });

  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const cartObject = remoteQueryObjectFromString({
    entryPoint: "cart",
    variables: { filters: { id: cartId } },
    fields: CART_SNAPSHOT_FIELDS,
  });
  const [cart] = await remoteQuery(cartObject);
  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart ${cartId} not found after add`,
    );
  }

  return res.status(200).json({ cart });
}
