import { defineMiddlewares } from "@medusajs/medusa";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/*",
      middlewares: [],
    },
    {
      matcher: "/admin/*",
      middlewares: [],
    },
  ],
});
