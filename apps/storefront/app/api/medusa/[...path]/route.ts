import { NextRequest, NextResponse } from "next/server";

// #region agent log
import { appendFile } from "node:fs/promises";
const DEBUG_LOG_PATH = "/Users/kamilpodobinski/lumineconcept.pl/.cursor/debug-8a1bb3.log";
function dbg(payload: Record<string, unknown>) {
  const line =
    JSON.stringify({ sessionId: "8a1bb3", timestamp: Date.now(), ...payload }) +
    "\n";
  appendFile(DEBUG_LOG_PATH, line).catch(() => {});
}
// #endregion

/**
 * Proxy Store API → Medusa (ten sam origin w przeglądarce, bez CORS).
 * Rewrite w next.config do zewnętrznego hosta w dev (Turbopack) potrafi zwracać 500 przy POST — jawny fetch jest stabilniejszy.
 */

/** Vercel: dłuższy cold start Railway / Medusa — unikaj przedwczesnego 504 „Application failed to respond”. */
export const maxDuration = 60;
/**
 * Node runtime — Edge nie obsługuje części nagłówków + 4.5MB body limit,
 * a mamy POST-y z dużymi payloadami (np. completeCart z line items).
 */
export const runtime = "nodejs";
/**
 * Railway backend siedzi w EU. Vercel domyślnie rozstawia funkcje globalnie,
 * co dawało +150–400ms na każdym hopie US ↔ EU. Przypinamy funkcję do
 * Frankfurt — proxy leci EU → EU. Przy 5–8 requestach checkoutu to realnie
 * 1–2 s oszczędności end-to-end.
 */
export const preferredRegion = ["fra1"];
/** Proxy nie może być cache'owany ani prerenderowany — zawsze świeży request. */
export const dynamic = "force-dynamic";
const BACKEND =
  process.env.MEDUSA_BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim() ||
  "http://localhost:9000";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

/**
 * Whitelist pierwszego segmentu ścieżki. Bez tego proxy jest otwartą bramą
 * do Medusy (w tym `/admin`), a w razie wycieku URL-a w HTML każdy request
 * wychodzi poza host. `custom` = nasze `/store/custom/*` endpointy.
 */
const ALLOWED_FIRST_SEGMENT = new Set(["store", "auth", "custom"]);

/**
 * Pojedynczy request do Medusy nie może „wisieć" dłużej niż 55 s. Medusa v2
 * pod Railway przy zimnym starcie potrafi zwalniać do 30–40 s na
 * `completeCart` (workflow + event bus + tax calc + fulfillment).
 * Trzymamy się pod limitem Vercela (60 s), żeby proxy zdążyło odpowiedzieć.
 */
const UPSTREAM_TIMEOUT_MS = 55_000;

function filterRequestHeaders(req: NextRequest): Headers {
  const h = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      h.set(key, value);
    }
  });
  return h;
}

function ensureStorePublishableKey(headers: Headers, path: string) {
  if (!path.startsWith("store/")) return
  const key =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ??
    process.env.MEDUSA_PUBLISHABLE_KEY
  if (key && !headers.has("x-publishable-api-key")) {
    headers.set("x-publishable-api-key", key)
  }
}

async function proxy(req: NextRequest, pathSegments: string[]) {
  const firstSegment = pathSegments[0] ?? "";
  if (!ALLOWED_FIRST_SEGMENT.has(firstSegment)) {
    return NextResponse.json(
      { message: "Segment nieobsługiwany przez proxy." },
      { status: 404 },
    );
  }

  const path = pathSegments.join("/");
  const base = BACKEND.replace(/\/$/, "");
  const url = `${base}/${path}${req.nextUrl.search}`;

  const headers = filterRequestHeaders(req)
  ensureStorePublishableKey(headers, path)

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) {
      init.body = buf;
    }
  }

  // #region agent log
  const __t = Date.now();
  dbg({
    location: "proxy.route.ts",
    message: "→ upstream request",
    data: { method: req.method, path, search: req.nextUrl.search || "" },
    hypothesisId: "H1",
  });
  // #endregion

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    const isAbort =
      (e as { name?: string }).name === "TimeoutError" ||
      (e as { name?: string }).name === "AbortError";
    // #region agent log
    dbg({
      location: "proxy.route.ts",
      message: "✗ upstream error",
      data: {
        method: req.method,
        path,
        ms: Date.now() - __t,
        isAbort,
        err: ((e as { message?: string })?.message ?? "").slice(0, 200),
      },
      hypothesisId: "H1",
    });
    // #endregion
    console.error(
      `[proxy] ${req.method} /${path} — upstream ${isAbort ? "timeout" : "error"}`,
      e,
    );
    return NextResponse.json(
      {
        message: isAbort
          ? "Medusa nie odpowiedziała w wymaganym czasie. Spróbuj ponownie."
          : "Nie udało się połączyć z Medusą.",
      },
      { status: 504 },
    );
  }

  // #region agent log
  dbg({
    location: "proxy.route.ts",
    message: "← upstream response",
    data: { method: req.method, path, ms: Date.now() - __t, status: res.status },
    hypothesisId: "H1",
  });
  // #endregion

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
