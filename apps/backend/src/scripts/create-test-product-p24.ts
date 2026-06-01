import type { SubscriberArgs } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Tworzy (idempotentnie) tani produkt testowy „TEST P24 1 zł" do weryfikacji
 * realnej płatności Przelewy24 na produkcji za grosze. Opublikowany w domyślnym
 * kanale, bez śledzenia stanu (manage_inventory: false), z kategorią i tagiem
 * „gotowe-wzory" — dzięki temu otwiera się pod /sklep/gotowe-wzory/<handle>.
 *
 * Jeśli produkt już istnieje, usuwa go i tworzy na nowo (pewna ścieżka — krok
 * update workflow ma buga przy populate `category_ids`).
 * Uruchom (w kontenerze): pnpm medusa exec ./src/scripts/create-test-product-p24.ts
 * Po teście usuń/odepnij produkt w Admin.
 */
const TEST_HANDLE = "test-p24-1zl";
const CATEGORY_HANDLE = "gotowe-wzory";
const TAG_VALUE = "gotowe-wzory";

interface ProductModuleLike {
  listProducts: (
    filters?: Record<string, unknown>,
  ) => Promise<Array<{ id: string; handle?: string }>>;
  listProductCategories: (
    filters?: Record<string, unknown>,
  ) => Promise<Array<{ id: string; handle?: string; name?: string }>>;
  listProductTags: (
    filters?: Record<string, unknown>,
  ) => Promise<Array<{ id: string; value?: string }>>;
  createProductTags: (
    data: Array<{ value: string }>,
  ) => Promise<Array<{ id: string; value?: string }>>;
}

export default async function createTestProductP24({
  container,
}: Pick<SubscriberArgs, "container">) {
  const productService = container.resolve(
    Modules.PRODUCT,
  ) as unknown as ProductModuleLike;

  const categories = await productService.listProductCategories({
    handle: CATEGORY_HANDLE,
  });
  const category = categories[0];
  if (!category) {
    throw new Error(`Brak kategorii o handle "${CATEGORY_HANDLE}".`);
  }

  const existingTags = await productService.listProductTags({
    value: TAG_VALUE,
  });
  let tag = existingTags[0];
  if (!tag) {
    const created = await productService.createProductTags([
      { value: TAG_VALUE },
    ]);
    tag = created[0];
  }
  if (!tag) {
    throw new Error(`Nie udało się utworzyć tagu "${TAG_VALUE}".`);
  }

  const existing = await productService.listProducts({ handle: TEST_HANDLE });
  const existingProduct = existing[0];
  if (existingProduct) {
    await deleteProductsWorkflow(container).run({
      input: { ids: [existingProduct.id] },
    });
    console.log(
      `[create-test-product-p24] Usunięto istniejący produkt (id=${existingProduct.id}) — tworzę na nowo z kategorią + tagiem.`,
    );
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

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "TEST P24 1 zł",
          handle: TEST_HANDLE,
          status: "published",
          shipping_profile_id: profile.id,
          description:
            "Produkt techniczny do weryfikacji płatności Przelewy24. Usuń po teście.",
          category_ids: [category.id],
          tag_ids: [tag.id],
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
          sales_channels: [{ id: channel.id }],
        },
      ],
    },
  });

  console.log(
    `[create-test-product-p24] Utworzono „TEST P24 1 zł" (handle=${TEST_HANDLE}, kanał=${channel.name}, kategoria=${category.name ?? CATEGORY_HANDLE}, tag=${TAG_VALUE}, cena=1 zł).`,
  );
}
