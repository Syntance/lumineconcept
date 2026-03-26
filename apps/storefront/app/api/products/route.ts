import { NextResponse, type NextRequest } from "next/server";
import { getProducts } from "@/lib/medusa/products";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const limit = Number(sp.get("_limit") ?? "12");
  const offset = Number(sp.get("_offset") ?? "0");
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
      };
    });

    return NextResponse.json({ products, count: response.count });
  } catch (err) {
    console.error("[API /products] Error:", err);
    return NextResponse.json({ products: [], count: 0 }, { status: 500 });
  }
}
