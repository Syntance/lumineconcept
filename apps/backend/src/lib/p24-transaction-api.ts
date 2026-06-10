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

export type P24TransactionInfo = {
  status: number;
  orderId: number;
  amount: number;
  currency: string;
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

/** Odpytuje P24 o stan transakcji po `sessionId`. */
export async function fetchP24TransactionBySessionId(
  sessionId: string,
  config: P24ApiConfig,
): Promise<P24TransactionInfo | null> {
  try {
    const result = await p24ApiGet<{
      data?: {
        status: number;
        orderId: number;
        amount: number;
        currency: string;
      };
    }>(config, `/transaction/by/sessionId/${encodeURIComponent(sessionId)}`);
    if (!result.data) return null;
    return {
      status: Number(result.data.status),
      orderId: Number(result.data.orderId),
      amount: Number(result.data.amount),
      currency: String(result.data.currency ?? "PLN"),
    };
  } catch {
    return null;
  }
}

/**
 * Mapuje stan sesji P24 na wynik strony powrotu klienta.
 * `allowFailedOnZero` — po krótkim oknie pollingu status 0 = anulowana/nieudana płatność.
 */
export function resolveP24ReturnOutcome(params: {
  sessionData: P24SessionData;
  tx: P24TransactionInfo | null;
  allowFailedOnZero: boolean;
}): P24ReturnOutcome {
  if (params.sessionData.status === "verified") return "paid";

  const rawStatus = params.tx?.status;
  if (rawStatus === P24_STATUS_PAID || rawStatus === P24_STATUS_VERIFY) {
    return rawStatus === P24_STATUS_PAID ? "paid" : "pending";
  }

  if (rawStatus === P24_STATUS_NO_PAYMENT && params.allowFailedOnZero) {
    return "failed";
  }

  if (rawStatus === P24_STATUS_NO_PAYMENT) {
    return "pending";
  }

  return "pending";
}
