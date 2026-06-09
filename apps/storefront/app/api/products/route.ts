import { NextResponse, type NextRequest } from "next/server";
import { isPriceSort } from "@/components/product/filter-types";
import { getProducts } from "@/lib/medusa/products";
import {
  filterProductsBySearch,
  isSearchQueryActive,
  resolveSearchProductIds,
} from "@/lib/products/product-search";
import {
  extractFilterConfig,
  medusaProductToSimple,
  type SimpleProduct,
} from "@/lib/products/simple-product";
import {
  type ProductFilterParams,
  normalizeProductFilterParams,
  productPassesFilters,
} from "@/lib/products/product-filters";

const MAX_LIMIT = 50;
const MEDUSA_BATCH = 50;

function parseCategoryIds(sp: URLSearchParams): string[] | undefined {
  const raw = sp.get("category");
  if (!raw?.trim()) return undefined;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length ? ids : undefined;
}

function parseFilters(sp: URLSearchParams): ProductFilterParams {
  const split = (key: string) =>
    sp
      .get(key)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const ledRaw = sp.get("led");
  const led = ledRaw === "1" ? true : ledRaw === "0" ? false : undefined;
  const priceMin = Number(sp.get("priceMin"));
  const priceMax = Number(sp.get("priceMax"));

  return {
    sizes: split("sizes"),
    materials: split("materials"),
    finishes: split("finishes"),
    led,
    priceMin: Number.isFinite(priceMin) && sp.has("priceMin") ? priceMin : undefined,
    priceMax: Number.isFinite(priceMax) && sp.has("priceMax") ? priceMax : undefined,
    pill: sp.get("pill") ?? undefined,
  };
}

function needsFullCatalogScan(f: ProductFilterParams, priceSort: boolean): boolean {
  if (priceSort) return true;
  if (f.sizes.length > 0 || f.materials.length > 0 || f.finishes.length > 0) return true;
  if (f.led !== undefined) return true;
  if (f.priceMin !== undefined || f.priceMax !== undefined) return true;
  if (f.pill && f.pill !== "all") return true;
  return false;
}

function sortCollectedProducts(
  collected: SimpleProduct[],
  sort: string,
  priceSort: boolean,
  searchActive: boolean,
): void {
  if (priceSort) {
    collected.sort((a, b) =>
      sort === "price_asc" ? a.price - b.price : b.price - a.price,
    );
    return;
  }

  if (searchActive) {
    if (sort === "created_at") collected.reverse();
    if (sort === "title") {
      collected.sort((a, b) => a.title.localeCompare(b.title, "pl"));
    }
    if (sort === "-title") {
      collected.sort((a, b) => b.title.localeCompare(a.title, "pl"));
    }
    return;
  }

  if (sort === "title" || sort === "-title") {
    collected.sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title, "pl")
        : b.title.localeCompare(a.title, "pl"),
    );
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawLimit = Number(sp.get("_limit") ?? "12");
  const rawOffset = Number(sp.get("_offset") ?? "0");
  const limit = Math.min(Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 12), MAX_LIMIT);
  const offset = Math.max(0, Number.isFinite(rawOffset) ? rawOffset : 0);
  const categoryIds = parseCategoryIds(sp);
  const sort = sp.get("sort") ?? "-created_at";
  const priceSort = isPriceSort(sort);
  const filters = parseFilters(sp);
  const searchQuery = sp.get("q")?.trim() ?? "";
  const searchActive = isSearchQueryActive(searchQuery);

  try {
    let searchIds: string[] | "fallback" | null = null;
    if (searchActive) {
      searchIds = await resolveSearchProductIds(searchQuery);
      if (Array.isArray(searchIds) && searchIds.length === 0) {
        return NextResponse.json(
          { products: [], count: 0 },
          { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } },
        );
      }
    }

    const mustScan = needsFullCatalogScan(filters, priceSort) || searchActive;

    if (!mustScan) {
      const response = await getProducts({
        limit,
        offset,
        category_id: categoryIds,
        order: sort,
      });

      const products = response.products.map((p) =>
        medusaProductToSimple(p as unknown as Record<string, unknown>),
      );

      return NextResponse.json(
        { products, count: response.count },
        { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
      );
    }

    const medusaOrder = priceSort ? "-created_at" : sort;
    const allInCategory: SimpleProduct[] = [];
    let medusaOffset = 0;
    let totalMedusa = Infinity;

    while (medusaOffset < totalMedusa) {
      const response = await getProducts({
        limit: MEDUSA_BATCH,
        offset: medusaOffset,
        category_id: categoryIds,
        order: medusaOrder,
      });
      totalMedusa = response.count;

      for (const raw of response.products) {
        allInCategory.push(
          medusaProductToSimple(raw as unknown as Record<string, unknown>),
        );
      }

      medusaOffset += response.products.length;
      if (response.products.length === 0) break;
    }

    const facets = extractFilterConfig(allInCategory);
    const effectiveFilters = normalizeProductFilterParams(filters, facets);
    let collected = allInCategory.filter((p) =>
      productPassesFilters(p, effectiveFilters),
    );

    if (searchActive && searchIds) {
      collected = filterProductsBySearch(collected, searchQuery, searchIds);
    }

    sortCollectedProducts(collected, sort, priceSort, searchActive);

    const products = collected.slice(offset, offset + limit);

    return NextResponse.json(
      { products, count: collected.length },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } },
    );
  } catch (err) {
    console.error("[API /products] Error:", err);
    return NextResponse.json({ products: [], count: 0 }, { status: 500 });
  }
}
