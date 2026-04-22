import { defineMiddlewares } from "@medusajs/medusa";
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

// #region agent log
/**
 * Debug sesja 8a1bb3 — instrumentacja timingu `POST /store/carts/:id/complete`.
 * `console.info` idzie do stdout Railway, później wyciągamy `railway logs
 * --filter "dbg-8a1bb3"`. Blok do usunięcia po potwierdzonej naprawie.
 */
const dbgCompleteTiming = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const t0 = Date.now();
  const reqId = Math.random().toString(36).slice(2, 8);
  const cartId = (req.params as { id?: string })?.id ?? "?";
  console.info(
    `[dbg-8a1bb3] complete-start reqId=${reqId} cart=${cartId} idem=${req.headers["idempotency-key"] ?? "-"}`,
  );
  res.on("close", () => {
    console.info(
      `[dbg-8a1bb3] complete-close reqId=${reqId} cart=${cartId} status=${res.statusCode} ms=${Date.now() - t0}`,
    );
  });
  res.on("finish", () => {
    console.info(
      `[dbg-8a1bb3] complete-finish reqId=${reqId} cart=${cartId} status=${res.statusCode} ms=${Date.now() - t0}`,
    );
  });
  next();
};
// #endregion

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/*",
      middlewares: [],
    },
    // #region agent log
    {
      matcher: "/store/carts/:id/complete",
      method: ["POST"],
      middlewares: [dbgCompleteTiming],
    },
    // #endregion
    {
      matcher: "/admin/*",
      middlewares: [],
    },
    {
      matcher: "/admin/uploads",
      method: ["POST"],
      bodyParser: { sizeLimit: "10mb" },
    },
    {
      matcher: "/admin/products/:id",
      method: ["POST"],
      bodyParser: { sizeLimit: "10mb" },
    },
    {
      matcher: "/admin/products/:id/text-fields",
      method: ["POST"],
      bodyParser: { sizeLimit: "10mb" },
    },
    {
      matcher: "/admin/product-categories/:id",
      method: ["POST"],
      bodyParser: { sizeLimit: "10mb" },
    },
  ],
});
