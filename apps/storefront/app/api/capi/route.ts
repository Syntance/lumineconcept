import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isBrowserCapiEvent } from "@/lib/analytics/capi-browser-allowlist";
import { checkCapiRateLimit } from "@/lib/analytics/capi-rate-limit";
import { capiBrowserPayloadSchema } from "@/lib/analytics/capi-schema";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";

function capiEnabled(): boolean {
  return process.env.CAPI_ENABLED === "true";
}

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "").toLowerCase();
}

function parseAllowedOrigins(): string[] {
  const raw = process.env.CAPI_ALLOWED_ORIGINS?.trim();
  if (!raw) {
    return ["http://localhost:3000"];
  }
  return raw
    .split(",")
    .map((entry) => normalizeOrigin(entry.trim()))
    .filter(Boolean);
}

function requestOriginAllowed(request: NextRequest): boolean {
  const allowed = parseAllowedOrigins();
  const origin = request.headers.get("origin")?.trim();
  const referer = request.headers.get("referer")?.trim();

  if (origin) {
    return allowed.includes(normalizeOrigin(origin));
  }

  if (referer) {
    try {
      const refOrigin = normalizeOrigin(new URL(referer).origin);
      return allowed.includes(refOrigin);
    } catch {
      return false;
    }
  }

  return false;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    "anonymous"
  );
}

function hashEmail(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex");
}

function hashPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return crypto.createHash("sha256").update(digits).digest("hex");
}

export async function POST(request: NextRequest) {
  if (!capiEnabled()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (!requestOriginAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const ip = clientIp(request);
  const rateLimit = await checkCapiRateLimit(ip);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter ?? 60),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = capiBrowserPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payload = parsed.data;

  if (!isBrowserCapiEvent(payload.event_name)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const hashedEmail = payload.user_data.email
    ? hashEmail(payload.user_data.email)
    : undefined;
  const hashedPhone = payload.user_data.phone
    ? hashPhone(payload.user_data.phone)
    : undefined;

  const eventData = {
    data: [
      {
        event_name: payload.event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.event_id,
        event_source_url: payload.event_source_url,
        action_source: "website",
        user_data: {
          em: hashedEmail ? [hashedEmail] : undefined,
          ph: hashedPhone ? [hashedPhone] : undefined,
          client_ip_address: ip,
          client_user_agent: userAgent,
          fbp: payload.user_data.fbp,
          fbc: payload.user_data.fbc,
        },
        custom_data: payload.custom_data,
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify(eventData),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      console.error(
        "[capi] Graph API error",
        response.status,
        bodyText.slice(0, 200),
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[capi] request failed", error);
    return NextResponse.json({ ok: true });
  }
}
