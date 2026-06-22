import { describe, expect, it } from "vitest";

import type { CategoryTreeNode } from "@/lib/medusa/category-tree";
import { buildGotoweWzoryMobileSub } from "@/lib/navigation/shop-mobile-nav";

const tree: CategoryTreeNode[] = [
	{
		id: "root-gw",
		handle: "gotowe-wzory",
		name: "Gotowe wzory",
		category_children: [
			{ id: "cat-cenniki", handle: "cenniki", name: "Cenniki" },
			{ id: "cat-certyfikaty", handle: "certyfikaty", name: "Certyfikaty" },
		],
	},
];

describe("buildGotoweWzoryMobileSub", () => {
	it("zwraca podkategorie gotowych wzorów bez roota i tablic z logo", () => {
		const sub = buildGotoweWzoryMobileSub(tree);

		expect(sub.map((item) => item.label)).toEqual(["Cenniki", "Certyfikaty"]);
		expect(sub[0]?.href).toBe("/sklep/gotowe-wzory/cenniki");
		expect(sub[1]?.href).toBe("/sklep/certyfikaty");
	});
});
