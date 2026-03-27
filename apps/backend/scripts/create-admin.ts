import { ExecArgs } from "@medusajs/framework/types";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function createAdmin({ container }: ExecArgs) {
  const userService = container.resolve(Modules.USER);
  const authService = container.resolve(Modules.AUTH);
  const apiKeyService = container.resolve(Modules.API_KEY);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const link = container.resolve(ContainerRegistrationKeys.LINK);

  const email = "kamil@lumineconcept.pl";
  const password = "SecurePass2026";

  // 1. Create auth identity + user
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

    const user = await userService.createUsers({ email });
    console.log("[setup] Admin user created:", user.id);

    await authService.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: { user_id: user.id },
    });
    console.log("[setup] Auth identity linked to user");
  } catch (e: any) {
    console.log("[setup] User/auth might exist:", e.message);
  }

  // 2. Ensure default sales channel exists
  let salesChannelId: string;
  try {
    const channels = await salesChannelService.listSalesChannels({});
    if (channels.length > 0) {
      salesChannelId = channels[0].id;
      console.log("[setup] Found sales channel:", salesChannelId, channels[0].name);
    } else {
      const channel = await salesChannelService.createSalesChannels({
        name: "Default Sales Channel",
        description: "Główny kanał sprzedaży",
        is_disabled: false,
      });
      salesChannelId = channel.id;
      console.log("[setup] Created sales channel:", salesChannelId);
    }
  } catch (e: any) {
    console.log("[setup] Sales channel error:", e.message);
    return;
  }

  // 3. Create or find publishable API key
  let apiKeyId: string | undefined;
  try {
    const keys = await apiKeyService.listApiKeys({ type: "publishable" });
    if (keys.length > 0) {
      apiKeyId = keys[0].id;
      console.log("[setup] PUBLISHABLE_KEY=" + keys[0].token);
    } else {
      const key = await apiKeyService.createApiKeys({
        title: "Storefront",
        type: "publishable",
        created_by: "system",
      });
      apiKeyId = key.id;
      console.log("[setup] PUBLISHABLE_KEY=" + key.token);
    }
  } catch (e: any) {
    console.log("[setup] API key error:", e.message);
  }

  // 4. Link publishable key → sales channel
  if (apiKeyId && salesChannelId) {
    try {
      await link.create({
        [Modules.API_KEY]: { publishable_key_id: apiKeyId },
        [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannelId },
      });
      console.log("[setup] Linked publishable key to sales channel");
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        console.log("[setup] Link already exists");
      } else {
        console.log("[setup] Link error:", e.message);
      }
    }
  }
}
