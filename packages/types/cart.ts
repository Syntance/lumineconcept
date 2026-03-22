export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  product_id: string;
  title: string;
  description: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  variant: {
    id: string;
    title: string;
    sku: string;
    options: Record<string, string>;
  };
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  provider: "inpost_parcel_locker" | "inpost_courier" | "dpd_courier";
  estimated_delivery: string;
}

export interface Cart {
  id: string;
  region_id: string;
  items: CartItem[];
  shipping_methods: ShippingMethod[];
  shipping_address?: Address;
  billing_address?: Address;
  email?: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  total: number;
  payment_session?: PaymentSession;
}

export interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}

export interface PaymentSession {
  id: string;
  provider_id: "przelewy24" | "paypo";
  status: "pending" | "authorized" | "captured" | "canceled" | "refunded";
  data: Record<string, unknown>;
}

export type ShippingProvider = "inpost_parcel_locker" | "inpost_courier" | "dpd_courier";
export type PaymentProvider = "przelewy24" | "paypo";
