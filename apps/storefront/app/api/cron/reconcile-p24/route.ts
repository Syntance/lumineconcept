import { NextResponse } from "next/server";
import { getConfiguredMedusaBackendUrl } from "@/lib/medusa/resolve-backend-url";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Ten sam sekret server-to-server co notify-* / order-email. */
function internalSecret(): string | undefined {
  return (
    process.env.ORDER_EMAIL_INTERNAL_SECRET?.replace(/\r\n/g, "").trim() ||
    process.env.MEDUSA_REVALIDATE_SECRET?.replace(/\r\n/g, "").trim() ||
    undefined
  );
}

/** Czy żądanie pochodzi z Vercel Cron (nagłówek Bearer CRON_SECRET) lub ma sekret. */
function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.trim();
  const bearerToken = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : undefined;

  // Vercel Cron wysyła Authorization: Bearer {CRON_SECRET} gdy ustawiony.
  if (cronSecret && bearerToken === cronSecret) return true;

  // Gdy CRON_SECRET nie ustawiony — akceptujemy internalSecret jako Bearer
  // (ustaw CRON_SECRET=ORDER_EMAIL_INTERNAL_SECRET w Vercel, żeby Cron automatycznie
  // dostawał nagłówek). Fallback chroni przez brak możliwości działania bez sekretu.
  const secret = internalSecret();
  if (secret && bearerToken === secret) return true;

  // Ręczne wywołanie (np. curl od operatora) z nagłówkiem x-order-email-secret.
  const provided = request.headers.get("x-order-email-secret")?.trim();
  return Boolean(secret && provided && provided === secret);
}

/**
 * GET /api/cron/reconcile-p24
 *
 * Cron Vercel (patrz vercel.json) — siatka bezpieczeństwa Przelewy24 niezależna
 * od trybu workera Medusy. Woła backendowy `/store/custom/reconcile-p24`, który
 * domyka opłacone, ale niesfinalizowane koszyki P24 i wysyła maile zamówieniowe.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const secret = internalSecret();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "missing ORDER_EMAIL_INTERNAL_SECRET / MEDUSA_REVALIDATE_SECRET" },
      { status: 500 },
    );
  }

  const base = getConfiguredMedusaBackendUrl().replace(/\/$/, "");

  const publishableKey =
    process.env.MEDUSA_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim() ||
    "";

  try {
    const res = await fetch(`${base}/store/custom/reconcile-p24`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-order-email-secret": secret,
        ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
      },
      body: "{}",
      signal: AbortSignal.timeout(55_000),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status, backend: data },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, backend: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "reconcile call failed" },
      { status: 502 },
    );
  }
}
