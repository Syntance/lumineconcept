import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy Store API → Medusa (ten sam origin w przeglądarce, bez CORS).
 * Rewrite w next.config do zewnętrznego hosta w dev (Turbopack) potrafi
 * zwracać 500 przy POST — jawny fetch jest stabilniejszy.
 */

/** Vercel: dłuższy cold start Railway / Medusa — unikaj przedwczesnego 504. */
export const maxDuration = 30;
/**
 * Node runtime — Edge nie obsługuje części nagłówków + 4.5MB body limit,
 * a mamy POST-y z większymi payloadami (completeCart z line items).
 */
export const runtime = "nodejs";
/**
 * Railway backend siedzi w EU. Vercel domyślnie rozstawia funkcje globalnie,
 * co dawało +150–400 ms na każdym hopie US ↔ EU. Przypinamy funkcję do
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
 * Timeout upstream Medusy. Po wdrożeniu workflow-engine-redis + event-bus-redis
 * `completeCart` wraca w <2 s, nawet przy cold starcie Railway. 25 s to
 * margines bezpieczeństwa (pod limitem Vercela 30 s) — jeśli kiedykolwiek
 * przekroczymy, to znaczy że coś realnie się zepsuło, nie że czekamy.
 */
const UPSTREAM_TIMEOUT_MS = 25_000;

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
  if (!path.startsWith("store/")) return;
  const key =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ??
    process.env.MEDUSA_PUBLISHABLE_KEY;
  if (key && !headers.has("x-publishable-api-key")) {
    headers.set("x-publishable-api-key", key);
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

  const headers = filterRequestHeaders(req);
  ensureStorePublishableKey(headers, path);

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
  const __dbgT0 = Date.now();
  fetch('http://127.0.0.1:7563/ingest/03da0fba-45c0-409f-a1e1-c2130a31ed12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8a1bb3'},body:JSON.stringify({sessionId:'8a1bb3',location:'proxy/route.ts:110',message:'proxy:entry',data:{method:req.method,path,hasBody:!!init.body},timestamp:__dbgT0,hypothesisId:'H1-H2-H3-H4'})}).catch(()=>{});
  // #endregion
  let res: Response;
  const __dbgUpStart = Date.now();
  try {
    res = await fetch(url, init);
  } catch (e) {
    const isAbort =
      (e as { name?: string }).name === "TimeoutError" ||
      (e as { name?: string }).name === "AbortError";
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
  const __dbgUpMs = Date.now() - __dbgUpStart;
  const __dbgTotalMs = Date.now() - __dbgT0;
  fetch('http://127.0.0.1:7563/ingest/03da0fba-45c0-409f-a1e1-c2130a31ed12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8a1bb3'},body:JSON.stringify({sessionId:'8a1bb3',location:'proxy/route.ts:130',message:'proxy:exit',data:{method:req.method,path,status:res.status,upstreamMs:__dbgUpMs,totalMs:__dbgTotalMs,overheadMs:__dbgTotalMs-__dbgUpMs},timestamp:Date.now(),hypothesisId:'H1-H2-H3-H4'})}).catch(()=>{});
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
