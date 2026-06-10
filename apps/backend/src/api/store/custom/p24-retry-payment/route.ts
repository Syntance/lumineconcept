import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { createPaymentSessionsWorkflow } from "@medusajs/medusa/core-flows";
import { PRZELEWY24_PROVIDER_ID } from "../../../../lib/p24-reconcile";

type Body = { cart_id?: string };

/**
 * POST /store/custom/p24-retry-payment
 *
 * Usuwa starą sesję P24 i rejestruje nową transakcję — zwraca redirect_url do bramki.
 */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const cartId = req.body?.cart_id?.trim();
  if (!cartId) {
    return res.status(400).json({ message: "cart_id jest wymagane" });
  }

  const scope = req.scope;
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const paymentModule = scope.resolve(Modules.PAYMENT);

  const cartObject = remoteQueryObjectFromString({
    entryPoint: "cart",
    variables: { filters: { id: cartId } },
    fields: [
      "id",
      "email",
      "completed_at",
      "items.id",
      "payment_collection.id",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.data",
    ],
  });
  const [cartRow] = await remoteQuery(cartObject);
  if (!cartRow) {
    return res.status(404).json({ message: "Koszyk nie istnieje" });
  }

  const cart = cartRow as {
    completed_at?: string | null;
    email?: string;
    items?: Array<{ id?: string }> | null;
    payment_collection?: {
      id?: string;
      payment_sessions?: Array<{
        id: string;
        provider_id?: string;
        data?: { redirect_url?: string };
      }>;
    };
  };

  if (cart.completed_at) {
    return res.status(400).json({
      message: "Koszyk został już opłacony — nie można ponowić płatności.",
      type: "cart_completed",
    });
  }
  if (!cart.items?.length) {
    return res.status(400).json({
      message: "Koszyk jest pusty.",
      type: "cart_empty",
    });
  }

  const paymentCollectionId = cart.payment_collection?.id;
  if (!paymentCollectionId) {
    return res.status(422).json({
      message: "Brak kolekcji płatności — wróć do checkoutu.",
    });
  }

  const p24Sessions =
    cart.payment_collection?.payment_sessions?.filter(
      (s) => s.provider_id === PRZELEWY24_PROVIDER_ID,
    ) ?? [];

  for (const session of p24Sessions) {
    await paymentModule.deletePaymentSession(session.id);
  }

  await createPaymentSessionsWorkflow(scope).run({
    input: {
      payment_collection_id: paymentCollectionId,
      provider_id: PRZELEWY24_PROVIDER_ID,
      data: {
        cart_id: cartId,
        email: cart.email ?? "",
      },
    },
  });

  const sessionObject = remoteQueryObjectFromString({
    entryPoint: "payment_session",
    variables: {
      filters: {
        payment_collection_id: paymentCollectionId,
        provider_id: PRZELEWY24_PROVIDER_ID,
      },
    },
    fields: ["id", "data"],
  });
  const sessions = (await remoteQuery(sessionObject)) as Array<{
    data?: { redirect_url?: string };
  }>;

  const redirectUrl = sessions
    .map((s) => s.data?.redirect_url)
    .find((url): url is string => Boolean(url));

  if (!redirectUrl) {
    return res.status(502).json({
      message: "Nie udało się przygotować płatności. Spróbuj ponownie.",
    });
  }

  return res.status(200).json({ ok: true, redirect_url: redirectUrl });
}
