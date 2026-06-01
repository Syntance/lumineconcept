import type { SubscriberArgs } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Tworzy (idempotentnie) tani produkt testowy „TEST P24 1 zł" do weryfikacji
 * realnej płatności Przelewy24 na produkcji za grosze. Opublikowany w domyślnym
 * kanale, bez śledzenia stanu magazynowego (manage_inventory: false).
 *
 * Uruchom: railway run pnpm --filter @lumine/backend medusa exec ./src/scripts/create-test-product-p24.ts
 * Po teście usuń/odepnij produkt w Admin.
 */
const TEST_HANDLE = "test-p24-1zl";

export default async function createTestProductP24({
  container,
}: Pick<SubscriberArgs, "container">) {
  const query = container.resolve("query") as {
    graph: (args: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: Array<{ id: string; handle?: string }> }>;
  };

  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: TEST_HANDLE },
  });

  const existingProduct = existing[0];
  if (existingProduct) {
    console.log(
      `[create-test-product-p24] Produkt już istnieje (handle=${TEST_HANDLE}, id=${existingProduct.id}) — pomijam.`,
    );
    return;
  }

  const salesChannelService = container.resolve(Modules.SALES_CHANNEL) as {
    listSalesChannels: (
      filters?: Record<string, unknown>,
    ) => Promise<Array<{ id: string; name: string }>>;
  };
  const channels = await salesChannelService.listSalesChannels({});
  const channel = channels[0];
  if (!channel) {
    throw new Error("Brak kanału sprzedaży — utwórz domyślny w Admin.");
  }
  const salesChannelId = channel.id;

  const fulfillmentService = container.resolve(Modules.FULFILLMENT) as {
    listShippingProfiles: (
      filters?: Record<string, unknown>,
    ) => Promise<Array<{ id: string; name: string }>>;
  };
  const profiles = await fulfillmentService.listShippingProfiles({});
  const profile = profiles[0];
  if (!profile) {
    throw new Error("Brak profilu wysyłki — bootstrap shipping najpierw.");
  }
  const shippingProfileId = profile.id;

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "TEST P24 1 zł",
          handle: TEST_HANDLE,
          status: "published",
          shipping_profile_id: shippingProfileId,
          description:
            "Produkt techniczny do weryfikacji płatności Przelewy24. Usuń po teście.",
          options: [{ title: "Wariant", values: ["Standard"] }],
          variants: [
            {
              title: "Standard",
              sku: "TEST-P24-1ZL",
              manage_inventory: false,
              options: { Wariant: "Standard" },
              prices: [{ amount: 1, currency_code: "pln" }],
            },
          ],
          sales_channels: [{ id: salesChannelId }],
        },
      ],
    },
  });

  console.log(
    `[create-test-product-p24] Utworzono „TEST P24 1 zł" (handle=${TEST_HANDLE}, kanał=${channel.name}, cena=1 zł).`,
  );
}
