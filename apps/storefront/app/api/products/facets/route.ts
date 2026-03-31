import { NextResponse, type NextRequest } from "next/server";
import { getProducts } from "@/lib/medusa/products";
import {
  extractFilterConfig,
  medusaProductToSimple,
  type SimpleProduct,
} from "@/lib/products/simple-product";

const MEDUSA_BATCH = 50;

/** Agregacja opcji filtrów (serwer, cache) — bez wysyłania pełnej listy produktów do klienta. */
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") ?? undefined;

  try {
    const all: SimpleProduct[] = [];
    let medusaOffset = 0;
    let totalMedusa = Infinity;

    while (medusaOffset < totalMedusa) {
      const response = await getProducts({
        limit: MEDUSA_BATCH,
        offset: medusaOffset,
        category_id: category ? [category] : undefined,
        order: "-created_at",
      });
      totalMedusa = response.count;

      for (const raw of response.products) {
        all.push(medusaProductToSimple(raw as unknown as Record<string, unknown>));
      }

      medusaOffset += response.products.length;
      if (response.products.length === 0) break;
    }

    const facets = extractFilterConfig(all);

    return NextResponse.json(facets, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("[API /products/facets] Error:", err);
    return NextResponse.json(
      {
        sizes: [],
        materials: [],
        finishes: [],
        hasLed: false,
        minPrice: 0,
        maxPrice: 0,
      },
      { status: 500 },
    );
  }
}
