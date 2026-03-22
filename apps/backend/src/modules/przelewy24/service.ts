import crypto from "node:crypto";

interface Przelewy24Options {
  merchantId: string;
  posId: string;
  apiKey: string;
  crc: string;
  sandbox: boolean;
}

interface TransactionRegisterPayload {
  sessionId: string;
  amount: number;
  currency: string;
  description: string;
  email: string;
  country: string;
  language: string;
  urlReturn: string;
  urlStatus: string;
}

interface TransactionVerifyPayload {
  sessionId: string;
  orderId: number;
  amount: number;
  currency: string;
}

/**
 * Przelewy24 Payment Provider for MedusaJS v2
 *
 * Supports: BLIK, bank transfers, credit cards via P24 gateway.
 * Flow: register transaction → redirect to P24 → callback verification
 */
export default class Przelewy24PaymentService {
  static identifier = "przelewy24";

  private merchantId: string;
  private posId: string;
  private apiKey: string;
  private crc: string;
  private sandbox: boolean;
  private baseUrl: string;

  constructor(_container: Record<string, unknown>, options: Przelewy24Options) {
    this.merchantId = options.merchantId;
    this.posId = options.posId;
    this.apiKey = options.apiKey;
    this.crc = options.crc;
    this.sandbox = options.sandbox;
    this.baseUrl = this.sandbox
      ? "https://sandbox.przelewy24.pl"
      : "https://secure.przelewy24.pl";
  }

  private generateSign(data: Record<string, string | number>): string {
    const jsonPayload = JSON.stringify(data);
    return crypto.createHash("sha384").update(jsonPayload).digest("hex");
  }

  private async apiRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" = "POST",
    body?: Record<string, unknown>,
  ): Promise<T> {
    const credentials = Buffer.from(`${this.posId}:${this.apiKey}`).toString("base64");
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Przelewy24 API error: ${response.status} — ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async registerTransaction(payload: TransactionRegisterPayload): Promise<{ token: string }> {
    const sign = this.generateSign({
      sessionId: payload.sessionId,
      merchantId: Number(this.merchantId),
      amount: payload.amount,
      currency: payload.currency,
      crc: this.crc,
    });

    // TODO: Verify endpoint path with P24 v2 REST API docs
    const result = await this.apiRequest<{ data: { token: string } }>(
      "/api/v1/transaction/register",
      "POST",
      {
        merchantId: Number(this.merchantId),
        posId: Number(this.posId),
        sessionId: payload.sessionId,
        amount: payload.amount,
        currency: payload.currency,
        description: payload.description,
        email: payload.email,
        country: payload.country,
        language: payload.language,
        urlReturn: payload.urlReturn,
        urlStatus: payload.urlStatus,
        sign,
      },
    );

    return { token: result.data.token };
  }

  getRedirectUrl(token: string): string {
    return `${this.baseUrl}/trnRequest/${token}`;
  }

  async verifyTransaction(payload: TransactionVerifyPayload): Promise<{ status: string }> {
    const sign = this.generateSign({
      sessionId: payload.sessionId,
      orderId: payload.orderId,
      amount: payload.amount,
      currency: payload.currency,
      crc: this.crc,
    });

    // TODO: Verify endpoint path with P24 v2 REST API docs
    const result = await this.apiRequest<{ data: { status: string } }>(
      "/api/v1/transaction/verify",
      "PUT",
      {
        merchantId: Number(this.merchantId),
        posId: Number(this.posId),
        sessionId: payload.sessionId,
        orderId: payload.orderId,
        amount: payload.amount,
        currency: payload.currency,
        sign,
      },
    );

    return { status: result.data.status };
  }

  async initiatePayment(context: {
    amount: number;
    currency_code: string;
    resource_id: string;
    customer: { email: string };
    return_url: string;
    webhook_url: string;
  }): Promise<{
    session_data: Record<string, unknown>;
    update_requests: { customer_metadata: Record<string, unknown> };
  }> {
    const { token } = await this.registerTransaction({
      sessionId: context.resource_id,
      amount: Math.round(context.amount),
      currency: context.currency_code.toUpperCase(),
      description: `Zamówienie Lumine #${context.resource_id}`,
      email: context.customer.email,
      country: "PL",
      language: "pl",
      urlReturn: context.return_url,
      urlStatus: context.webhook_url,
    });

    return {
      session_data: {
        token,
        redirect_url: this.getRedirectUrl(token),
      },
      update_requests: {
        customer_metadata: { p24_session: context.resource_id },
      },
    };
  }

  async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<string> {
    const status = paymentSessionData.status as string | undefined;
    return status ?? "pending";
  }
}
