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
 * Aktualizuje wyłącznie metadata.express_delivery przez Cart Module — bez updateCartWorkflow
 * (workflow potrafi zwracać 500 przy problemach z Redis / refresh line items przy samej zmianie metadata).
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

  const prev =
    existing.metadata && typeof existing.metadata === "object"
      ? { ...existing.metadata }
      : {};
  const metadata = {
    ...prev,
    express_delivery: body.express_delivery ? "true" : "false",
  };

  await cartModule.updateCarts([{ id: cartId, metadata }]);

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "cart",
    variables: { filters: { id: cartId } },
    fields: defaultStoreCartFields,
  });
  const [cart] = await remoteQuery(queryObject);
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found after update`);
  }

  return res.status(200).json({ cart });
}
