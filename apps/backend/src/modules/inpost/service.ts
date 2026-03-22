interface InPostOptions {
  apiKey: string;
  organizationId: string;
  sandbox: boolean;
}

interface ShipmentPayload {
  receiver: {
    name: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      building_number: string;
      city: string;
      post_code: string;
      country_code: string;
    };
  };
  parcels: Array<{
    dimensions: { length: number; width: number; height: number };
    weight: { amount: number };
  }>;
  service: "inpost_locker_standard" | "inpost_courier_standard";
  target_point?: string;
  reference?: string;
}

/**
 * InPost Fulfillment Provider for MedusaJS v2
 *
 * Supports: Paczkomaty (parcel lockers) + InPost Courier
 * Flow: create shipment → generate label → track
 */
export default class InPostFulfillmentService {
  static identifier = "inpost";

  private apiKey: string;
  private organizationId: string;
  private sandbox: boolean;
  private baseUrl: string;

  constructor(_container: Record<string, unknown>, options: InPostOptions) {
    this.apiKey = options.apiKey;
    this.organizationId = options.organizationId;
    this.sandbox = options.sandbox;
    this.baseUrl = this.sandbox
      ? "https://sandbox-api-shipx-pl.easypack24.net/v1"
      : "https://api-shipx-pl.easypack24.net/v1";
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
      throw new Error(`InPost API error: ${response.status} — ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async getShippingOptions(): Promise<
    Array<{
      id: string;
      name: string;
      price: number;
      estimated_days: string;
    }>
  > {
    return [
      {
        id: "inpost_parcel_locker",
        name: "InPost Paczkomat",
        price: 1299,
        estimated_days: "1-2 dni robocze",
      },
      {
        id: "inpost_courier",
        name: "InPost Kurier",
        price: 1599,
        estimated_days: "1-2 dni robocze",
      },
    ];
  }

  async createShipment(
    payload: ShipmentPayload,
  ): Promise<{ id: string; tracking_number: string; status: string }> {
    const result = await this.apiRequest<{
      id: number;
      tracking_number: string;
      status: string;
    }>(`/organizations/${this.organizationId}/shipments`, "POST", {
      receiver: payload.receiver,
      parcels: payload.parcels,
      service: payload.service,
      custom_attributes: payload.target_point
        ? { target_point: payload.target_point }
        : undefined,
      reference: payload.reference,
    });

    return {
      id: String(result.id),
      tracking_number: result.tracking_number,
      status: result.status,
    };
  }

  async getLabel(shipmentId: string): Promise<Buffer> {
    const response = await fetch(
      `${this.baseUrl}/organizations/${this.organizationId}/shipments/${shipmentId}/label`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/pdf",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`InPost label error: ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async getTracking(
    trackingNumber: string,
  ): Promise<{ status: string; tracking_url: string }> {
    const result = await this.apiRequest<{ status: string }>(
      `/tracking/${trackingNumber}`,
      "GET",
    );

    return {
      status: result.status,
      tracking_url: `https://inpost.pl/sledzenie-przesylek?number=${trackingNumber}`,
    };
  }

  async createFulfillment(data: {
    order_id: string;
    shipping_address: {
      first_name: string;
      last_name: string;
      address_1: string;
      city: string;
      postal_code: string;
      country_code: string;
      phone: string;
    };
    email: string;
    shipping_option_id: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    data: { tracking_number: string; shipment_id: string };
  }> {
    const isLocker = data.shipping_option_id === "inpost_parcel_locker";
    const targetPoint = data.metadata?.inpost_locker_id as string | undefined;

    const shipment = await this.createShipment({
      receiver: {
        name: `${data.shipping_address.first_name} ${data.shipping_address.last_name}`,
        email: data.email,
        phone: data.shipping_address.phone,
        address: isLocker
          ? undefined
          : {
              street: data.shipping_address.address_1,
              building_number: "",
              city: data.shipping_address.city,
              post_code: data.shipping_address.postal_code,
              country_code: data.shipping_address.country_code,
            },
      },
      parcels: [
        {
          dimensions: { length: 30, width: 25, height: 10 },
          weight: { amount: 1 },
        },
      ],
      service: isLocker ? "inpost_locker_standard" : "inpost_courier_standard",
      target_point: isLocker ? targetPoint : undefined,
      reference: data.order_id,
    });

    return {
      data: {
        tracking_number: shipment.tracking_number,
        shipment_id: shipment.id,
      },
    };
  }
}
