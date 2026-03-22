interface DpdOptions {
  login: string;
  password: string;
  fid: string;
}

interface DpdParcelPayload {
  sender: {
    company: string;
    name: string;
    address: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phone: string;
    email: string;
  };
  receiver: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phone: string;
    email: string;
  };
  parcels: Array<{
    weight: number;
    sizeX: number;
    sizeY: number;
    sizeZ: number;
  }>;
  reference: string;
}

/**
 * DPD Fulfillment Provider for MedusaJS v2
 *
 * Backup courier option. Flow: create parcel → generate label → track
 */
export default class DpdFulfillmentService {
  static identifier = "dpd";

  private login: string;
  private password: string;
  private fid: string;
  // TODO: Verify DPD API base URLs — they use SOAP/REST depending on integration type
  private baseUrl = "https://dpdservices.dpd.com.pl/DPDPackageObjServicesService/DPDPackageObjServices";

  constructor(_container: Record<string, unknown>, options: DpdOptions) {
    this.login = options.login;
    this.password = options.password;
    this.fid = options.fid;
  }

  private getAuthData() {
    return {
      login: this.login,
      password: this.password,
      masterFid: this.fid,
    };
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
        id: "dpd_courier",
        name: "DPD Kurier",
        price: 1899,
        estimated_days: "1-3 dni robocze",
      },
    ];
  }

  // TODO: DPD uses SOAP — consider using a SOAP client library or REST API if available
  async createParcel(
    payload: DpdParcelPayload,
  ): Promise<{ waybill: string; parcelId: string }> {
    const body = {
      authDataV1: this.getAuthData(),
      pkgAddressFieldV1: {
        sender: {
          company: payload.sender.company,
          name: payload.sender.name,
          address: payload.sender.address,
          city: payload.sender.city,
          postalCode: payload.sender.postalCode,
          countryCode: payload.sender.countryCode,
          phone: payload.sender.phone,
          email: payload.sender.email,
        },
        receiver: {
          name: payload.receiver.name,
          address: payload.receiver.address,
          city: payload.receiver.city,
          postalCode: payload.receiver.postalCode,
          countryCode: payload.receiver.countryCode,
          phone: payload.receiver.phone,
          email: payload.receiver.email,
        },
      },
      parcels: payload.parcels.map((p) => ({
        weight: p.weight,
        sizeX: p.sizeX,
        sizeY: p.sizeY,
        sizeZ: p.sizeZ,
        content: payload.reference,
      })),
    };

    // TODO: Implement actual DPD SOAP/REST API call
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`DPD API error: ${response.status}`);
    }

    const result = (await response.json()) as {
      waybill: string;
      parcelId: string;
    };
    return result;
  }

  async getTracking(
    waybill: string,
  ): Promise<{ status: string; tracking_url: string }> {
    return {
      status: "in_transit",
      tracking_url: `https://tracktrace.dpd.com.pl/parcelDetails?typ=1&p1=${waybill}`,
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
  }): Promise<{
    data: { tracking_number: string; parcel_id: string };
  }> {
    const result = await this.createParcel({
      sender: {
        company: "Lumine Concept",
        name: "Lumine Concept",
        address: "ul. Przykładowa 1",
        city: "Warszawa",
        postalCode: "00-001",
        countryCode: "PL",
        phone: "+48000000000",
        email: "sklep@lumineconcept.pl",
      },
      receiver: {
        name: `${data.shipping_address.first_name} ${data.shipping_address.last_name}`,
        address: data.shipping_address.address_1,
        city: data.shipping_address.city,
        postalCode: data.shipping_address.postal_code,
        countryCode: data.shipping_address.country_code,
        phone: data.shipping_address.phone,
        email: data.email,
      },
      parcels: [{ weight: 1, sizeX: 30, sizeY: 25, sizeZ: 10 }],
      reference: data.order_id,
    });

    return {
      data: {
        tracking_number: result.waybill,
        parcel_id: result.parcelId,
      },
    };
  }
}
