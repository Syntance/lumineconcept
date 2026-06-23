/** 0 = brak płatności, 1 = oczekuje verify, 2 = opłacone. */
export const P24_STATUS_NO_PAYMENT = 0;
export const P24_STATUS_VERIFY = 1;
export const P24_STATUS_PAID = 2;

export type P24ReturnOutcome = "paid" | "pending" | "failed";

export type P24SessionData = {
  p24_session_id?: string;
  status?: "pending" | "verified";
  amount_grosz?: number;
  [k: string]: unknown;
};

export type P24PaymentMethod = {
  id: number;
  name: string;
  group?: string;
};

export type P24TransactionInfo = {
  status: number;
  orderId: number;
  amount: number;
  currency: string;
  methodId?: number;
  statement?: string;
};

export type P24ApiConfig = {
  posId: string;
  apiKey: string;
  sandbox: boolean;
};

export function loadP24ApiConfig(): P24ApiConfig | null {
  const posId = (
    process.env.PRZELEWY24_POS_ID ?? process.env.PRZELEWY24_MERCHANT_ID
  )?.trim();
  const apiKey = process.env.PRZELEWY24_API_KEY?.trim();
  if (!posId || !apiKey) return null;
  return {
    posId,
    apiKey,
    sandbox: process.env.PRZELEWY24_SANDBOX === "true",
  };
}

function p24ApiBase(sandbox: boolean): string {
  const host = sandbox
    ? "https://sandbox.przelewy24.pl"
    : "https://secure.przelewy24.pl";
  return `${host}/api/v1`;
}

async function p24ApiGet<T>(
  config: P24ApiConfig,
  endpoint: string,
): Promise<T> {
  const credentials = Buffer.from(`${config.posId}:${config.apiKey}`).toString(
    "base64",
  );
  const res = await fetch(`${p24ApiBase(config.sandbox)}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`P24 GET ${endpoint} → ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

/** Wyciąga numeric methodId z odpowiedzi P24 (różne wersje API). */
export function extractP24MethodId(
  data: Record<string, unknown> | null | undefined,
): number | null {
  if (!data) return null;
  for (const key of [
    "methodId",
    "method",
    "paymentMethod",
    "payment_method",
    "paymentMethodId",
    "p24_method_id",
  ]) {
    const id = Number(data[key]);
    if (Number.isFinite(id) && id > 0) return id;
  }
  return null;
}

/** Odpytuje P24 o stan transakcji po `sessionId`. */
export async function fetchP24TransactionBySessionId(
  sessionId: string,
  config: P24ApiConfig,
): Promise<P24TransactionInfo | null> {
  try {
    const result = await p24ApiGet<{
      data?: Record<string, unknown>;
    }>(config, `/transaction/by/sessionId/${encodeURIComponent(sessionId)}`);
    if (!result.data) return null;
    const row = result.data;
    const methodId = extractP24MethodId(row);
    const statement =
      typeof row.statement === "string" ? row.statement : undefined;
    return {
      status: Number(row.status),
      orderId: Number(row.orderId),
      amount: Number(row.amount),
      currency: String(row.currency ?? "PLN"),
      ...(methodId ? { methodId } : {}),
      ...(statement ? { statement } : {}),
    };
  } catch {
    return null;
  }
}

/** Odpytuje P24 po numeric `orderId` (id transakcji w panelu P24). */
export async function fetchP24TransactionByOrderId(
  orderId: number,
  config: P24ApiConfig,
): Promise<P24TransactionInfo | null> {
  if (!Number.isFinite(orderId) || orderId <= 0) return null;
  try {
    const result = await p24ApiGet<{
      data?: Record<string, unknown>;
    }>(config, `/transaction/by/orderId/${orderId}`);
    if (!result.data) return null;
    const row = result.data;
    const methodId = extractP24MethodId(row);
    return {
      status: Number(row.status),
      orderId: Number(row.orderId ?? orderId),
      amount: Number(row.amount),
      currency: String(row.currency ?? "PLN"),
      ...(methodId ? { methodId } : {}),
    };
  } catch {
    return null;
  }
}

/** Lista metod płatności P24 dla merchanta (BLIK, banki, karty…). */
export async function fetchP24PaymentMethods(
  config: P24ApiConfig,
  language = "pl",
): Promise<P24PaymentMethod[]> {
  try {
    const result = await p24ApiGet<{
      data?: Array<{ id?: number; name?: string; group?: string }>;
    }>(config, `/payment/methods/${language}`);
    return (result.data ?? [])
      .map((row) => ({
        id: Number(row.id),
        name: String(row.name ?? "").trim(),
        group: typeof row.group === "string" ? row.group : undefined,
      }))
      .filter((row) => Number.isFinite(row.id) && row.id > 0 && row.name);
  } catch {
    return [];
  }
}

/**
 * Mapuje stan sesji P24 na wynik strony powrotu klienta.
 *
 * Zasada: klient wrócił z bramki — domyślnie „failed”, dopóki nie ma dowodu
 * opłacenia (2 / verified) albo trwającej autoryzacji (1).
 * `allowFailedOnZero` = min. okno grace na frontendzie zanim pokażemy failed.
 */
export function resolveP24ReturnOutcome(params: {
  sessionData: P24SessionData;
  tx: P24TransactionInfo | null;
  allowFailedOnZero: boolean;
}): P24ReturnOutcome {
  if (params.sessionData.status === "verified") return "paid";

  const rawStatus = params.tx?.status;

  if (rawStatus === P24_STATUS_PAID) return "paid";
  if (rawStatus === P24_STATUS_VERIFY) return "pending";

  if (!params.allowFailedOnZero) {
    return "pending";
  }

  // Status 0, brak transakcji w P24 lub nieznany — anulowana / nieudana płatność.
  return "failed";
}
