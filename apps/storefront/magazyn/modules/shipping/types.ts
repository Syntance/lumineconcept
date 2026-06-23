export type AdminShippingOption = {
	id: string;
	name: string;
	typeCode: string | null;
	typeLabel: string | null;
	typeDescription: string | null;
	priceMinor: number;
	priceId: string | null;
	priceType: string | null;
	checkoutEnabled: boolean;
};

export type ShippingOptionUpdateInput = {
	name: string;
	priceMajor: number;
	typeLabel: string;
	typeDescription: string;
	checkoutEnabled: boolean;
};
