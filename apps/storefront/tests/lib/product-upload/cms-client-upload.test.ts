import { describe, expect, it } from "vitest";
import {
	isNetworkFetchError,
	isServerActionTransportError,
} from "@/lib/product-upload/cms-upload-errors";

describe("cms-client-upload", () => {
	it("isServerActionTransportError rozpoznaje komunikat Next.js Server Actions", () => {
		expect(
			isServerActionTransportError(
				new Error("An unexpected response was received from the server."),
			),
		).toBe(true);
		expect(isServerActionTransportError(new Error("Upload nie powiódł się."))).toBe(false);
	});

	it("isNetworkFetchError rozpoznaje zerwane połączenie", () => {
		expect(isNetworkFetchError(new TypeError("Failed to fetch"))).toBe(true);
		expect(isNetworkFetchError(new Error("Failed to fetch"))).toBe(false);
	});
});
