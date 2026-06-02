/** Status realizacji zamówienia w Medusa (cykl życia). */
export type OrderStatus =
	| "pending"
	| "completed"
	| "draft"
	| "archived"
	| "canceled"
	| "requires_action";

/** Status płatności w Medusa. */
export type OrderPaymentStatus =
	| "not_paid"
	| "awaiting"
	| "authorized"
	| "partially_authorized"
	| "captured"
	| "partially_captured"
	| "refunded"
	| "partially_refunded"
	| "canceled"
	| "requires_action";

/** Status wysyłki w Medusa. */
export type OrderFulfillmentStatus =
	| "not_fulfilled"
	| "partially_fulfilled"
	| "fulfilled"
	| "partially_shipped"
	| "shipped"
	| "partially_delivered"
	| "delivered"
	| "canceled";

export type OrderAddress = {
	firstName: string;
	lastName: string;
	company: string;
	address1: string;
	address2: string;
	city: string;
	postalCode: string;
	province: string;
	countryCode: string;
	phone: string;
};

export type OrderLineItem = {
	id: string;
	title: string;
	subtitle: string;
	quantity: number;
	unitPrice: number;
	total: number;
	thumbnail: string | null;
};

export type OrderPayment = {
	id: string;
	amount: number;
	currencyCode: string;
	capturedAt: string | null;
	canceledAt: string | null;
};

export type OrderFulfillment = {
	id: string;
	shippedAt: string | null;
	deliveredAt: string | null;
	canceledAt: string | null;
	items: Array<{ id: string; quantity: number }>;
};

export type AdminOrderRow = {
	id: string;
	displayId: number;
	status: OrderStatus;
	paymentStatus: OrderPaymentStatus;
	fulfillmentStatus: OrderFulfillmentStatus;
	email: string;
	customerName: string;
	currencyCode: string;
	total: number;
	itemCount: number;
	createdAt: string;
};

export type AdminOrderDetail = {
	id: string;
	displayId: number;
	status: OrderStatus;
	paymentStatus: OrderPaymentStatus;
	fulfillmentStatus: OrderFulfillmentStatus;
	email: string;
	phone: string;
	currencyCode: string;
	createdAt: string;
	updatedAt: string;
	items: OrderLineItem[];
	itemTotal: number;
	shippingTotal: number;
	taxTotal: number;
	discountTotal: number;
	total: number;
	shippingAddress: OrderAddress | null;
	billingAddress: OrderAddress | null;
	shippingMethodName: string | null;
	payments: OrderPayment[];
	fulfillments: OrderFulfillment[];
	metadata: Record<string, string>;
};
