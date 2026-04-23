import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import {
  addShippingMethodToCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
} from "@medusajs/medusa/core-flows";
import { defaultStoreCartFields } from "@medusajs/medusa/api/store/carts/query-config";

type Body = {
  cart_id?: string;
  option_id?: string;
  provider_id?: string;
};

/**
 * POST /store/custom/prepare-checkout
 *
 * Łączy 3 kroki checkoutu w jeden HTTP round-trip:
 *   1. dodanie metody dostawy (shipping method),
 *   2. utworzenie `payment_collection` dla koszyka (jeśli nie istnieje),
 *   3. utworzenie `payment_session` u wybranego providera (jeśli nie istnieje).
 *
 * Bez tego storefront robił 2 sekwencyjne requesty (addShippingMethod →
 * initiatePaymentSession), każdy ~600 ms network + workflow. Teraz jeden
 * request ~800 ms (workflows idą wewnętrznie, bez latencji HTTP między nimi).
 *
 * Endpoint jest idempotentny:
 *   - jeśli ta sama opcja dostawy jest już przypięta, Medusa w zasadzie
 *     nadpisuje ją (workflow sam obsługuje deduplikację per shipping_option),
 *   - payment_collection tworzone tylko jak nie istnieje,
 *   - payment_session tworzone tylko jak nie ma sesji dla podanego providera.
 *
 * Zwraca świeży cart + identyfikatory, żeby storefront nie musiał robić
 * dodatkowego `cart.retrieve`.
 */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const body = (req.body ?? {}) as Body;
  const cartId = body.cart_id?.trim();
  const optionId = body.option_id?.trim();
  const providerId = body.provider_id?.trim();

  if (!cartId || !optionId || !providerId) {
    return res.status(400).json({
      message: "cart_id, option_id oraz provider_id są wymagane",
    });
  }

  const scope = req.scope;

  try {
    await addShippingMethodToCartWorkflow(scope).run({
      input: {
        cart_id: cartId,
        options: [{ id: optionId }],
      },
    });

    const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
    const pcObject = remoteQueryObjectFromString({
      entryPoint: "cart",
      variables: { filters: { id: cartId } },
      fields: [
        "id",
        "completed_at",
        "payment_collection.id",
        "payment_collection.payment_sessions.id",
        "payment_collection.payment_sessions.provider_id",
        "payment_collection.payment_sessions.status",
      ],
    });
    let [cartSnapshot] = await remoteQuery(pcObject);
    if (!cartSnapshot) {
      return res.status(404).json({ message: `Cart ${cartId} not found` });
    }

    let paymentCollectionId = (cartSnapshot as {
      payment_collection?: { id?: string };
    }).payment_collection?.id;

    if (!paymentCollectionId) {
      const { result } = await createPaymentCollectionForCartWorkflow(scope).run({
        input: { cart_id: cartId },
      });
      paymentCollectionId = (result as { id: string }).id;
    }

    const sessions =
      ((cartSnapshot as {
        payment_collection?: {
          payment_sessions?: Array<{ id: string; provider_id: string; status?: string }>;
        };
      }).payment_collection?.payment_sessions) ?? [];

    /**
     * Medusa wywala „active payment_session already exists" jeśli dla
     * payment_collection istnieje już session o statusie authorized/pending
     * z innym providerem. W ścieżce storefrontu mamy tylko jednego providera
     * (pp_system_default), więc ten warunek jest tu głównie defensywny.
     */
    const hasSessionForProvider = sessions.some(
      (s) => s.provider_id === providerId,
    );

    if (!hasSessionForProvider) {
      await createPaymentSessionsWorkflow(scope).run({
        input: {
          payment_collection_id: paymentCollectionId!,
          provider_id: providerId,
        },
      });
    }

    // Ostateczny snapshot z polami jakich potrzebuje storefront (taki sam
    // kontrakt jak /store/carts/:id — żeby CheckoutForm mógł pominąć
    // dodatkowy `cart.retrieve`).
    const cartObject = remoteQueryObjectFromString({
      entryPoint: "cart",
      variables: { filters: { id: cartId } },
      fields: defaultStoreCartFields,
    });
    const [cart] = await remoteQuery(cartObject);
    if (!cart) {
      return res.status(404).json({ message: `Cart ${cartId} not found after prepare` });
    }

    return res.status(200).json({
      cart,
      payment_collection_id: paymentCollectionId,
    });
  } catch (e) {
    const err = e as { message?: string; type?: string; status?: number };
    console.error("[prepare-checkout] error", err);
    const status = err.status ?? 500;
    return res.status(status).json({
      message: err.message ?? "prepare-checkout failed",
      type: err.type,
    });
  }
}
