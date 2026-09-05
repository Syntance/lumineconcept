import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { syncAllProductHandles } from "@/magazyn/modules/products/sync-handles";

/**
 * Webhook wywoływany przez Medusa subscribery (product.created / product.updated /
 * product.deleted) kiedy chcemy unieważnić cache `unstable_cache` storefrontu.
 *
 * Chroniony przez `MEDUSA_REVALIDATE_SECRET` w nagłówku `x-webhook-secret`.
 * Body przyjmuje:
 *   { tags?: string[], paths?: string[], syncHandles?: boolean }
 *
 * Jeżeli body jest puste — revaliduje domyślny zestaw tagów Medusy, żeby
 * subscribery backendowe mogły po prostu zrobić POST bez body. `paths` jest
 * dokładane do stałego zestawu powierzchni SEO, nie zastępuje go.
 *
 * `syncHandles: true` — masowo ustawia slugi w Medusie z aktualnych tytułów
 * (bez ręcznego zapisywania każdego produktu w magazynie).
 */
const REVALIDATE_SECRET = process.env.MEDUSA_REVALIDATE_SECRET;

const DEFAULT_TAGS = [
  "medusa-products",
  "medusa-categories",
  "global-product-config",
  "magazyn-content",
  "site-settings",
];

/**
 * Powierzchnie SEO budowane z listy produktów. Nie mają tagu cache — same
 * `revalidate = 3600` — więc bez tego nowy albo odznaczony jako `noindex`
 * produkt czekałby do godziny na wejście do sitemapy albo wyjście z niej.
 */
const DEFAULT_PATHS = ["/sitemap.xml", "/llms.txt"];

/** Webhook jest chroniony sekretem, ale ścieżkę i tak przyjmujemy tylko lokalną. */
function isLocalPath(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");

  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: { tags?: string[]; paths?: string[]; syncHandles?: boolean } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  if (body.syncHandles) {
    try {
      const syncResult = await syncAllProductHandles();
      return NextResponse.json({
        revalidated: true,
        syncHandles: syncResult,
        now: Date.now(),
      });
    } catch (error) {
      console.error("[revalidate/medusa] syncHandles error", error);
      return NextResponse.json(
        { message: "Error syncing product handles" },
        { status: 500 },
      );
    }
  }

  const tags =
    Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : DEFAULT_TAGS;

  const requestedPaths = Array.isArray(body.paths) ? body.paths.filter(isLocalPath) : [];
  // Sitemapa i llms.txt odświeżają się przy każdym webhooku produktowym, także
  // gdy wołający poda własne `paths` — inaczej wystarczyłoby jedno wywołanie
  // z wąską listą, żeby indeks znowu rozjechał się z katalogiem.
  const paths = [...new Set([...DEFAULT_PATHS, ...requestedPaths])];

  try {
    for (const tag of tags) {
      revalidateTag(tag, "max");
    }
    for (const path of paths) {
      revalidatePath(path);
    }

    return NextResponse.json({
      revalidated: true,
      tags,
      paths,
      now: Date.now(),
    });
  } catch (error) {
    console.error("[revalidate/medusa] error", error);
    return NextResponse.json(
      { message: "Error revalidating" },
      { status: 500 },
    );
  }
}
