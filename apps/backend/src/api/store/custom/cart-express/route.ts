import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { defaultStoreCartFields } from "@medusajs/medusa/api/store/carts/query-config";

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

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "cart",
    variables: { filters: { id: cartId } },
    fields: defaultStoreCartFields,
  });
  const [cartSnapshot] = await remoteQuery(queryObject);
  if (!cartSnapshot) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found`);
  }

  const subRaw = (cartSnapshot as { subtotal?: unknown }).subtotal;
  const subtotalNum =
    typeof subRaw === "number"
      ? subRaw
      : typeof subRaw === "string"
        ? Number(subRaw)
        : 0;
  // Medusa v2 — kwoty dziesiętne w PLN. 50% subtotalu zaokrąglamy do groszy
  // (nie do pełnych złotych, jak było w konwencji grosze/integer).
  const expressFee = body.express_delivery
    ? Math.round(subtotalNum * 0.5 * 100) / 100
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

  const [cart] = await remoteQuery(queryObject);
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found after update`);
  }

  return res.status(200).json({ cart });
}
