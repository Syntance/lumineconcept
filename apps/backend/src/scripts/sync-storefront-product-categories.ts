import type { SubscriberArgs } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  batchLinkProductsToCategoryWorkflow,
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows";
import {
  STOREFRONT_GOTOWE_WZORY_CHILDREN,
  STOREFRONT_ROOT_CATEGORIES,
  resolveCategoryHandlesForProduct,
  type ProductLike,
} from "../lib/storefront-category-tree";

/**
 * Synchronizuje drzewo kategorii produktów w Medusie ze strukturą storefrontu
 * (/sklep → gotowe-wzory, logo-3d, certyfikaty + podkategorie „pigułek”).
 *
 * Uruchom w katalogu repo (wymaga .env w apps/backend: DATABASE_URL, ewent. REDIS_URL):
 *   pnpm sync-medusa-categories
 *
 * Opcjonalnie przypisz produkty do kategorii (heurystyka handle/tytuł jak na sklepie):
 *   pnpm sync-medusa-categories:link
 */
export default async function syncStorefrontProductCategories({
  container,
}: Pick<SubscriberArgs, "container">) {
  const linkProducts =
    process.argv.includes("--link-products") ||
    process.argv.includes("--assign-products");

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
      pagination?: { skip?: number; take?: number };
    }) => Promise<{
      data: Array<Record<string, unknown>>;
      metadata?: { count?: number };
    }>;
  };

  async function loadCategoriesByHandle(): Promise<Map<string, string>> {
    const { data } = await query.graph({
      entity: "product_category",
      fields: ["id", "handle", "parent_category_id"],
      filters: {},
    });
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      const h = row.handle as string | undefined;
      const id = row.id as string | undefined;
      if (h && id) map.set(h, id);
    }
    return map;
  }

  let byHandle = await loadCategoriesByHandle();

  console.log("[sync-categories] Tworzenie / aktualizacja rootów…");
  for (const root of STOREFRONT_ROOT_CATEGORIES) {
    const existingId = byHandle.get(root.handle);
    if (!existingId) {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: root.name,
              handle: root.handle,
              description: root.description,
              is_active: true,
              is_internal: false,
            },
          ],
        },
      });
      const created = result[0];
      if (created?.id && created.handle) {
        byHandle.set(created.handle, created.id);
      }
      console.log(`  + utworzono: ${root.handle}`);
    } else {
      await updateProductCategoriesWorkflow(container).run({
        input: {
          selector: { id: existingId },
          update: {
            name: root.name,
            handle: root.handle,
            description: root.description,
            parent_category_id: null,
            is_active: true,
            is_internal: false,
          },
        },
      });
      console.log(`  · zaktualizowano root: ${root.handle}`);
    }
  }

  byHandle = await loadCategoriesByHandle();
  const gotoweId = byHandle.get("gotowe-wzory");
  if (!gotoweId) {
    throw new Error("Brak kategorii gotowe-wzory po synchronizacji — sprawdź logi.");
  }

  console.log("[sync-categories] Podkategorie „Gotowe wzory”…");
  for (const child of STOREFRONT_GOTOWE_WZORY_CHILDREN) {
    const existingId = byHandle.get(child.handle);
    if (!existingId) {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: child.name,
              handle: child.handle,
              parent_category_id: gotoweId,
              is_active: true,
              is_internal: false,
            },
          ],
        },
      });
      const created = result[0];
      if (created?.id && created.handle) {
        byHandle.set(created.handle, created.id);
      }
      console.log(`  + utworzono: ${child.handle}`);
    } else {
      await updateProductCategoriesWorkflow(container).run({
        input: {
          selector: { id: existingId },
          update: {
            name: child.name,
            handle: child.handle,
            parent_category_id: gotoweId,
            is_active: true,
            is_internal: false,
          },
        },
      });
      console.log(`  · zaktualizowano: ${child.handle}`);
    }
  }

  byHandle = await loadCategoriesByHandle();

  if (!linkProducts) {
    console.log(
      "[sync-categories] Gotowe. Bez przypisywania produktów (uruchom z --link-products jeśli potrzeba).",
    );
    return;
  }

  console.log("[sync-categories] Przypisywanie produktów (heurystyka handle/tytuł)…");

  const allProducts: ProductLike[] = [];
  const PAGE = 200;
  let skip = 0;
  for (;;) {
    const { data: productRows } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "title"],
      filters: {},
      pagination: { skip, take: PAGE },
    });
    const rows = productRows ?? [];
    for (const r of rows) {
      const id = (r.id as string | undefined) ?? "";
      const handle = (r.handle as string | undefined) ?? "";
      if (!id || !handle) continue;
      allProducts.push({
        id,
        handle,
        title: (r.title as string | undefined) ?? "",
      });
    }
    if (rows.length < PAGE) break;
    skip += PAGE;
  }
  console.log(`  (znaleziono ${allProducts.length} produktów)`);

  const allHandles = [
    ...STOREFRONT_ROOT_CATEGORIES.map((c) => c.handle),
    ...STOREFRONT_GOTOWE_WZORY_CHILDREN.map((c) => c.handle),
  ];

  for (const catHandle of allHandles) {
    const categoryId = byHandle.get(catHandle);
    if (!categoryId) {
      console.warn(`  ! pomijam ${catHandle} — brak id`);
      continue;
    }

    const desiredIds = new Set(
      allProducts
        .filter((p) => resolveCategoryHandlesForProduct(p).includes(catHandle))
        .map((p) => p.id),
    );

    const { data: catRows } = await query.graph({
      entity: "product_category",
      fields: ["id", "products.id"],
      filters: { id: categoryId },
    });
    const row = catRows[0] as
      | { products?: Array<{ id?: string } | null> }
      | undefined;
    const currentIds = new Set(
      (row?.products ?? [])
        .map((x) => x?.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    );

    const add = [...desiredIds].filter((id) => !currentIds.has(id));
    const remove = [...currentIds].filter((id) => !desiredIds.has(id));

    if (add.length === 0 && remove.length === 0) {
      console.log(`  · ${catHandle}: bez zmian (${desiredIds.size} produktów)`);
      continue;
    }

    await batchLinkProductsToCategoryWorkflow(container).run({
      input: {
        id: categoryId,
        add,
        remove,
      },
    });
    console.log(
      `  · ${catHandle}: +${add.length} / −${remove.length} (łącznie ${desiredIds.size})`,
    );
  }

  console.log("[sync-categories] Przypisanie produktów zakończone.");
}
