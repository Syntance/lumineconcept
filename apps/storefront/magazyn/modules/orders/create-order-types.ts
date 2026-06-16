import type { TextFieldDef } from "@/lib/products/text-fields";
import type { ProductUploadSettings } from "@/lib/products/upload-settings";

export type OrderFormShippingOption = {
	id: string;
	name: string;
	amountMinor: number;
};

export type OrderFormProductOption = {
	productId: string;
	variantId: string;
	title: string;
	thumbnail: string | null;
	priceMinor: number | null;
};

export type OrderFormOptions = {
	shippingOptions: OrderFormShippingOption[];
	initialProducts: OrderFormProductOption[];
};

export type ManualOrderColorDef = {
	name: string;
	hex: string | null;
	category: string;
	matAllowed: boolean;
};

export type ManualOrderProductConfig = {
	productId: string;
	variantId: string;
	title: string;
	priceMinor: number | null;
	thumbnail: string | null;
	colorSlotTitles: string[];
	colorsBySlot: Record<string, ManualOrderColorDef[]>;
	allowCustomBySlot: Record<string, boolean>;
	matOverridesBySlot: Record<string, Record<string, boolean>>;
	textFields: TextFieldDef[];
	uploadSettings: ProductUploadSettings;
	linksCount: number;
	standAvailable: boolean;
	standColors: ManualOrderColorDef[];
	standAllowCustom: boolean;
	standMatOverrides: Record<string, boolean>;
	colorMap: Record<string, string>;
	matDisabledSet: string[];
	standColorOptionTitle: string;
};

export type ManualOrderLineInput = {
	variantId: string;
	productTitle: string;
	quantity: number;
	metadata?: Record<string, string>;
	lineNote?: string;
};

export type ManualOrderInput = {
	email: string;
	firstName: string;
	lastName: string;
	phone?: string;
	address1: string;
	postalCode: string;
	city: string;
	companyName?: string;
	nip?: string;
	orderNotes?: string;
	sourceChannel: "instagram" | "email" | "telefon" | "inne";
	shippingOptionId: string;
	items: ManualOrderLineInput[];
	sendConfirmationEmail: boolean;
	invoiceRequested: boolean;
};
