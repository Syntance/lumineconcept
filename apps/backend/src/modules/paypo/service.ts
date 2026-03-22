interface PayPoOptions {
  apiKey: string;
  sandbox: boolean;
}

interface PayPoOrderPayload {
  orderId: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
  };
  returnUrl: string;
  notifyUrl: string;
}

/**
 * PayPo Deferred Payment Provider for MedusaJS v2
 *
 * "Buy now, pay in 30 days" — integrated via Przelewy24 or direct API.
 * Minimum order amount: 40 PLN, Maximum: 3000 PLN.
 */
export default class PayPoPaymentService {
  static identifier = "paypo";
  static readonly MIN_AMOUNT_PLN = 4000; // in grosz (40 PLN)
  static readonly MAX_AMOUNT_PLN = 300000; // in grosz (3000 PLN)

  private apiKey: string;
  private sandbox: boolean;
  private baseUrl: string;

  constructor(_container: Record<string, unknown>, options: PayPoOptions) {
    this.apiKey = options.apiKey;
    this.sandbox = options.sandbox;
    // TODO: Verify sandbox/production URLs with PayPo API docs
    this.baseUrl = this.sandbox
      ? "https://sandbox.paypo.pl/api"
      : "https://api.paypo.pl/api";
  }

  private async apiRequest<T>(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPo API error: ${response.status} — ${error}`);
    }

    return response.json() as Promise<T>;
  }

  static isAmountEligible(amountInGrosze: number): boolean {
    return (
      amountInGrosze >= PayPoPaymentService.MIN_AMOUNT_PLN &&
      amountInGrosze <= PayPoPaymentService.MAX_AMOUNT_PLN
    );
  }

  async createOrder(payload: PayPoOrderPayload): Promise<{
    redirectUrl: string;
    paypoOrderId: string;
  }> {
    // TODO: Verify payload structure with PayPo REST API docs
    const result = await this.apiRequest<{
      redirectUrl: string;
      id: string;
    }>("/v1/orders", "POST", {
      externalOrderId: payload.orderId,
      amount: payload.amount,
      currency: payload.currency,
      customer: {
        email: payload.customer.email,
        firstName: payload.customer.firstName,
        lastName: payload.customer.lastName,
      },
      redirectUrl: payload.returnUrl,
      notifyUrl: payload.notifyUrl,
    });

    return {
      redirectUrl: result.redirectUrl,
      paypoOrderId: result.id,
    };
  }

  async getOrderStatus(paypoOrderId: string): Promise<string> {
    const result = await this.apiRequest<{ status: string }>(
      `/v1/orders/${paypoOrderId}`,
      "GET",
    );
    return result.status;
  }

  async initiatePayment(context: {
    amount: number;
    currency_code: string;
    resource_id: string;
    customer: { email: string; first_name: string; last_name: string };
    return_url: string;
    webhook_url: string;
  }): Promise<{
    session_data: Record<string, unknown>;
  }> {
    if (!PayPoPaymentService.isAmountEligible(context.amount)) {
      throw new Error(
        `Kwota ${context.amount / 100} PLN nie kwalifikuje się do PayPo. ` +
        `Minimalna kwota: ${PayPoPaymentService.MIN_AMOUNT_PLN / 100} PLN, ` +
        `maksymalna: ${PayPoPaymentService.MAX_AMOUNT_PLN / 100} PLN.`,
      );
    }

    const { redirectUrl, paypoOrderId } = await this.createOrder({
      orderId: context.resource_id,
      amount: context.amount,
      currency: context.currency_code.toUpperCase(),
      customer: {
        email: context.customer.email,
        firstName: context.customer.first_name,
        lastName: context.customer.last_name,
      },
      returnUrl: context.return_url,
      notifyUrl: context.webhook_url,
    });

    return {
      session_data: {
        paypo_order_id: paypoOrderId,
        redirect_url: redirectUrl,
      },
    };
  }
}
