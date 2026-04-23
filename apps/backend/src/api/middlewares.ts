import { defineMiddlewares } from "@medusajs/medusa";

export default defineMiddlewares({
  routes: [
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
