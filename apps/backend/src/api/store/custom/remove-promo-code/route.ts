import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
	ContainerRegistrationKeys,
	MedusaError,
	Modules,
	PromotionActions,
	remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows";
import {
	freeShippingPromotionCode,
	isShadowFreeShippingCode,
} from "../../../../lib/lumine-promotions";
import { STORE_CART_REMOTE_QUERY_FIELDS } from "../../../../lib/store-cart-fields";

type Body = {
	cart_id?: string;
	code?: string;
};

/**
 * POST /store/custom/remove-promo-code
 *
 * Usuwa kod promocyjny z koszyka wraz z powiązaną promocją darmowej dostawy.
 */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
	const cartId = req.body?.cart_id?.trim();
	const code = req.body?.code?.trim();

	if (!cartId || !code) {
		return res.status(400).json({ message: "cart_id oraz code są wymagane" });
	}

	const scope = req.scope;
	const cartModule = scope.resolve(Modules.CART);
	const existingList = await cartModule.listCarts(
		{ id: [cartId] },
		{ select: ["id", "completed_at"], take: 1 },
	);
	const existing = existingList[0];
	if (!existing) {
		throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found`);
	}
	if (existing.completed_at) {
		return res.status(400).json({ message: "Koszyk jest już zakończony" });
	}

	const normalized = code.trim().toUpperCase();
	if (isShadowFreeShippingCode(normalized)) {
		return res.status(400).json({ message: "Nie można usunąć tego kodu" });
	}

	const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
	const promoQuery = remoteQueryObjectFromString({
		entryPoint: "promotion",
		variables: { filters: { code: normalized } },
		fields: ["id", "code"],
	});
	const promotions = (await remoteQuery(promoQuery)) as Array<{ id: string; code: string }>;
	const main = promotions[0];
	if (!main) {
		return res.status(400).json({ message: "Kod nieprawidłowy lub wygasł" });
	}

	const promoCodes = [main.code, freeShippingPromotionCode(main.id)];

	await updateCartPromotionsWorkflow(scope).run({
		input: {
			cart_id: cartId,
			promo_codes: promoCodes,
			action: PromotionActions.REMOVE,
			force_refresh_payment_collection: true,
		},
	});

	const cartQuery = remoteQueryObjectFromString({
		entryPoint: "cart",
		variables: { filters: { id: cartId } },
		fields: STORE_CART_REMOTE_QUERY_FIELDS,
	});
	const [cart] = await remoteQuery(cartQuery);

	return res.status(200).json({ cart });
}
