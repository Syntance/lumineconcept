import { NextResponse, type NextRequest } from "next/server";
import { getProducts } from "@/lib/medusa/products";

const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawLimit = Number(sp.get("_limit") ?? "12");
  const rawOffset = Number(sp.get("_offset") ?? "0");
  const limit = Math.min(Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 12), MAX_LIMIT);
  const offset = Math.max(0, Number.isFinite(rawOffset) ? rawOffset : 0);
  const category = sp.get("category") ?? undefined;
  const sort = sp.get("sort") ?? "-created_at";

  try {
    const response = await getProducts({
      limit,
      offset,
      category_id: category ? [category] : undefined,
      order: sort,
    });

    const products = response.products.map((p) => {
      const variants = (p.variants ?? []) as unknown as Array<{
        calculated_price?: { calculated_amount: number };
      }>;
      const prices = variants
        .map((v) => Number(v.calculated_price?.calculated_amount ?? 0))
        .filter((pr) => pr > 0);

      const options = (p.options ?? []) as unknown as Array<{
        id: string;
        title: string;
        values: Array<{ value: string }>;
      }>;

      const optionsMap: Record<string, string[]> = {};
      for (const opt of options) {
        optionsMap[opt.title] = (opt.values ?? []).map((v) => v.value);
      }

      return {
        id: p.id,
        handle: p.handle ?? "",
        title: p.title,
        thumbnail: p.thumbnail ?? null,
        price: prices.length > 0 ? Math.min(...prices) : 0,
        hasVariantPrices: new Set(prices).size > 1,
        tags: (p.tags ?? []).map(
          (t) => ((t as unknown as { value: string }).value ?? "").toLowerCase(),
        ),
        options: optionsMap,
      };
    });

    return NextResponse.json(
      { products, count: response.count },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
    );
  } catch (err) {
    console.error("[API /products] Error:", err);
    return NextResponse.json({ products: [], count: 0 }, { status: 500 });
  }
}
