import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function createAdmin({ container }: ExecArgs) {
  const userService = container.resolve(Modules.USER);
  const authService = container.resolve(Modules.AUTH);
  const apiKeyService = container.resolve(Modules.API_KEY);

  const email = "kamil@lumineconcept.pl";
  const password = "SecurePass2026";

  // 1. Create auth identity
  try {
    const authIdentity = await authService.createAuthIdentities({
      provider_identities: [
        {
          entity_id: email,
          provider: "emailpass",
          provider_metadata: { password },
        },
      ],
    });
    console.log("[setup] Auth identity created:", authIdentity.id);

    // 2. Create admin user
    const user = await userService.createUsers({ email });
    console.log("[setup] Admin user created:", user.id);

    // 3. Link auth identity → user
    await authService.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: { user_id: user.id },
    });
    console.log("[setup] Auth identity linked to user");
  } catch (e: any) {
    console.log("[setup] User/auth might exist:", e.message);
  }

  // 4. Create or find publishable API key
  try {
    const keys = await apiKeyService.listApiKeys({ type: "publishable" });
    if (keys.length > 0) {
      console.log("[setup] PUBLISHABLE_KEY=" + keys[0].token);
    } else {
      const key = await apiKeyService.createApiKeys({
        title: "Storefront",
        type: "publishable",
        created_by: "system",
      });
      console.log("[setup] PUBLISHABLE_KEY=" + key.token);
    }
  } catch (e: any) {
    console.log("[setup] API key error:", e.message);
  }
}
