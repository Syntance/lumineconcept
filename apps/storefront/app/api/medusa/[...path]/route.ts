import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy Store API → Medusa (ten sam origin w przeglądarce, bez CORS).
 * Rewrite w next.config do zewnętrznego hosta w dev (Turbopack) potrafi zwracać 500 przy POST — jawny fetch jest stabilniejszy.
 */
const BACKEND =
  process.env.MEDUSA_BACKEND_URL ??
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
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
]);

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
  const path = pathSegments.join("/");
  const base = BACKEND.replace(/\/$/, "");
  const url = `${base}/${path}${req.nextUrl.search}`;

  const headers = filterRequestHeaders(req)
  ensureStorePublishableKey(headers, path)

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) {
      init.body = buf;
    }
  }

  const res = await fetch(url, init);

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
