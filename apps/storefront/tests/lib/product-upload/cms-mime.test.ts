import { describe, expect, it } from "vitest";
import {
	inferCmsMimeFromMeta,
	inferCmsMimeType,
	isCmsHeicFile,
	isCmsHeicMeta,
} from "@/lib/product-upload/cms-mime";

function mockFile(name: string, type = ""): File {
	return new File([new Uint8Array([0])], name, { type });
}

describe("cms-mime HEIC", () => {
	it("rozpoznaje HEIC po rozszerzeniu bez MIME (Windows)", () => {
		const file = mockFile("IMG_1234.HEIC", "");
		expect(inferCmsMimeType(file)).toBe("image/heic");
		expect(isCmsHeicFile(file)).toBe(true);
	});

	it("rozpoznaje HEIF po MIME", () => {
		const file = mockFile("photo.heif", "image/heif");
		expect(inferCmsMimeType(file)).toBe("image/heif");
		expect(isCmsHeicMeta("photo.heif", "image/heif")).toBe(true);
	});

	it("inferCmsMimeFromMeta działa dla presigned upload meta", () => {
		expect(inferCmsMimeFromMeta("hero.heic", "application/octet-stream")).toBe("image/heic");
	});

	it("odrzuca nieobrazowe rozszerzenia", () => {
		expect(inferCmsMimeType(mockFile("doc.pdf", "application/pdf"))).toBeNull();
	});
});
