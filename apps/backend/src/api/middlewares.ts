import { defineMiddlewares } from "@medusajs/medusa";
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http";

// #region agent log
// Tymczasowe logowanie czasów request/response dla debug-8a1bb3
// Loguje do Medusa logger + console.log (trafia do Railway logs).
const dbgTiming = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const t0 = Date.now();
  const method = req.method;
  const path = req.path;
  res.on("finish", () => {
    const ms = Date.now() - t0;
    console.log(
      `[dbg-8a1bb3] ${method} ${path} status=${res.statusCode} durationMs=${ms}`,
    );
  });
  next();
};
// #endregion

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/*",
      middlewares: [dbgTiming],
    },
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
