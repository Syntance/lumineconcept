import type { Address, CartItem, PaymentSession, ShippingMethod } from "./cart";

export type OrderStatus =
  | "pending"
  | "completed"
  | "archived"
  | "canceled"
  | "requires_action";

export type FulfillmentStatus =
  | "not_fulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "partially_shipped"
  | "shipped"
  | "partially_returned"
  | "returned"
  | "canceled";

export type PaymentStatus =
  | "not_paid"
  | "awaiting"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "canceled";

export interface Order {
  id: string;
  display_id: number;
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  payment_status: PaymentStatus;
  email: string;
  items: CartItem[];
  shipping_address: Address;
  billing_address: Address;
  shipping_methods: ShippingMethod[];
  payment_sessions: PaymentSession[];
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  total: number;
  currency_code: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrderConfirmation {
  order: Order;
  tracking_number?: string;
  estimated_delivery?: string;
}

export interface TrackingInfo {
  tracking_number: string;
  provider: string;
  status: string;
  estimated_delivery?: string;
  tracking_url: string;
}
