import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { STORE_CART_REMOTE_QUERY_FIELDS } from "../../../../lib/store-cart-fields";
import { captureMessage } from "../../../../lib/sentry";

/**
 * POST /store/custom/cart-express
 *
 * Ustawia metadata.express_delivery oraz express_fee_minor (50% subtotal w groszach, 0 gdy wyłączone)
 * przez Cart Module — bez updateCartWorkflow (workflow potrafi zwracać 500 przy lock / refresh line items).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as { cart_id?: string; express_delivery?: boolean };
  const cartId = body.cart_id?.trim();
  if (!cartId) {
    return res.status(400).json({ message: "cart_id jest wymagane" });
  }
  if (typeof body.express_delivery !== "boolean") {
    return res.status(400).json({ message: "express_delivery (boolean) jest wymagane" });
  }

  const cartModule = req.scope.resolve(Modules.CART);
  const existingList = await cartModule.listCarts(
    { id: [cartId] },
    { select: ["id", "metadata", "completed_at"], take: 1 },
  );
  const existing = existingList[0];
  if (!existing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found`);
  }
  if (existing.completed_at) {
    return res.status(400).json({ message: "Koszyk jest już zakończony" });
  }

  /**
   * KRYTYCZNE ×2:
   * 1. Pola muszą zawierać `items.total` — storefront po tej odpowiedzi
   *    przelicza „Produkty" z sum pozycji (rabaty!).
   * 2. Snapshot MUSI iść przez `query.graph` z filtrem, NIE przez
   *    `remoteQueryObjectFromString(variables.filters)`: przy polach z
   *    linkiem cross-module (`promotions.*`) tamten wariant GUBIŁ filtr
   *    i zwracał PIERWSZY koszyk z bazy — cudzy koszyk trafiał do UI
   *    klienta (incydent 06.07.2026: „pusty koszyk po kliknięciu express"
   *    + wyciek cudzych danych). Dodatkowo twardy assert id poniżej.
   */
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const readCartSnapshot = async () => {
    const { data } = await query.graph({
      entity: "cart",
      fields: STORE_CART_REMOTE_QUERY_FIELDS,
      filters: { id: cartId },
    });
    const snapshot = (data as Array<{ id?: string }>)[0];
    if (!snapshot) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found`);
    }
    // Defense-in-depth: NIGDY nie zwracamy koszyka innego niż żądany.
    if (snapshot.id !== cartId) {
      captureMessage("[cart-express] snapshot zwrócił inny koszyk niż żądany", "error", {
        requested_cart_id: cartId,
        returned_cart_id: snapshot.id ?? "?",
      });
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Nie udało się odczytać koszyka — spróbuj ponownie.",
      );
    }
    return snapshot;
  };

  const cartSnapshot = await readCartSnapshot();

  function amountToNumber(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    if (v && typeof v === "object") {
      // query.graph zwraca kwoty jako BigNumber (getter `numeric`); do JSON
      // serializują się jako liczby, ale w pamięci to obiekty — bez tej
      // gałęzi suma pozycji wychodziła 0 i fee zapisywało się jako "0".
      if ("numeric" in v) {
        return amountToNumber((v as { numeric: unknown }).numeric);
      }
      if ("value" in v) {
        return amountToNumber((v as { value: unknown }).value);
      }
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }
  // Baza dopłaty = suma `items.total` (PO rabatach) — parytet z CartProvider
  // (productsSubtotal) i prepare-checkout (itemSubtotal). `cart.subtotal`
  // jest PRZED rabatem, więc przy aktywnym kodzie promocyjnym metadata
  // pokazywałaby inną kwotę niż faktycznie pobierana.
  const snapshotItems =
    ((cartSnapshot as { items?: Array<{ total?: unknown }> | null }).items ?? []);
  const itemsTotalNum = snapshotItems.reduce(
    (sum, item) => sum + amountToNumber(item?.total),
    0,
  );
  // Medusa v2 — kwoty dziesiętne w PLN. 50% sumy pozycji zaokrąglamy do groszy
  // (nie do pełnych złotych, jak było w konwencji grosze/integer).
  const expressFee = body.express_delivery
    ? Math.round(itemsTotalNum * 0.5 * 100) / 100
    : 0;

  const prev =
    existing.metadata && typeof existing.metadata === "object"
      ? { ...existing.metadata }
      : {};
  const metadata = {
    ...prev,
    express_delivery: body.express_delivery ? "true" : "false",
    // Nazwa pola zachowana dla kompatybilności wstecznej — wartość to teraz
    // PLN decimal, nie grosze.
    express_fee_minor: String(expressFee),
  };

  await cartModule.updateCarts([{ id: cartId, metadata }]);

  const cart = await readCartSnapshot();

  return res.status(200).json({ cart });
}
