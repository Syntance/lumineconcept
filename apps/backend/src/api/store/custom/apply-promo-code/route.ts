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
	ensureCartShippingForPromo,
	promotionTargetsShipping,
} from "../../../../lib/ensure-cart-shipping-for-promo";
import { resolvePromotionCodesToApply, freeShippingPromotionCode } from "../../../../lib/lumine-promotions";
import { STORE_CART_REMOTE_QUERY_FIELDS } from "../../../../lib/store-cart-fields";

type Body = {
	cart_id?: string;
	code?: string;
};

/**
 * POST /store/custom/apply-promo-code
 *
 * Stosuje kod promocyjny w koszyku. Gdy kod ma powiązaną promocję darmowej dostawy
 * (__lumine_fs_*), dołącza ją automatycznie — klient wpisuje jeden kod.
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

	const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
	const normalized = code.trim().toUpperCase();
	const promoQuery = remoteQueryObjectFromString({
		entryPoint: "promotion",
		variables: { filters: { code: normalized } },
		fields: ["id", "code", "status"],
	});
	const matched = (await remoteQuery(promoQuery)) as Array<{
		id: string;
		code: string;
		status?: string;
	}>;

	const allForResolve = [...matched];
	const main = matched[0];
	if (main) {
		const shadowQuery = remoteQueryObjectFromString({
			entryPoint: "promotion",
			variables: { filters: { code: freeShippingPromotionCode(main.id) } },
			fields: ["id", "code", "status"],
		});
		const shadowRows = (await remoteQuery(shadowQuery)) as Array<{
			id: string;
			code: string;
			status?: string;
		}>;
		allForResolve.push(...shadowRows);
	}

	const promoCodes = resolvePromotionCodesToApply(code, allForResolve);
	if (promoCodes.length === 0) {
		return res.status(400).json({
			message: "Kod nieprawidłowy lub wygasł",
		});
	}

	const promotionIds = allForResolve
		.filter((promotion) => promoCodes.includes(promotion.code))
		.map((promotion) => promotion.id);

	// KRYTYCZNE: promocje na `shipping_methods` wymagają metody dostawy W KOSZYKU
	// PRZED dodaniem kodu — inaczej Medusa nie ma czego dyskontować (0% efektu
	// mimo poprawnie zastosowanego kodu). Musi się wykonać zanim JAKIKOLWIEK
	// promo_code (główny lub cień) trafi do `updateCartPromotionsWorkflow`.
	if (await promotionTargetsShipping(scope, promotionIds)) {
		await ensureCartShippingForPromo(scope, cartId);
	}

	await updateCartPromotionsWorkflow(scope).run({
		input: {
			cart_id: cartId,
			promo_codes: promoCodes,
			action: PromotionActions.ADD,
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
