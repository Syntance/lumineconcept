import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";

interface CAPIEventPayload {
  event_name: string;
  event_source_url: string;
  user_data: {
    email?: string;
    phone?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return NextResponse.json(
      { message: "Meta CAPI not configured" },
      { status: 503 },
    );
  }

  try {
    const payload = (await request.json()) as CAPIEventPayload;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "";
    const userAgent = request.headers.get("user-agent") ?? "";

    const hashedEmail = payload.user_data.email
      ? crypto
          .createHash("sha256")
          .update(payload.user_data.email.toLowerCase().trim())
          .digest("hex")
      : undefined;

    const hashedPhone = payload.user_data.phone
      ? crypto
          .createHash("sha256")
          .update(payload.user_data.phone.replace(/\D/g, ""))
          .digest("hex")
      : undefined;

    const eventData = {
      data: [
        {
          event_name: payload.event_name,
          event_time: Math.floor(Date.now() / 1000),
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

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      },
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: "CAPI error", error: String(error) },
      { status: 500 },
    );
  }
}
