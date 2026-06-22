import { describe, expect, it } from "vitest";

import type { CategoryTreeNode } from "@/lib/medusa/category-tree";
import { buildShopMobileNavSub } from "@/lib/navigation/shop-mobile-nav";

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

describe("buildShopMobileNavSub", () => {
	it("zawiera główne sekcje i podkategorie bez duplikatu certyfikatów", () => {
		const sub = buildShopMobileNavSub(tree);

		expect(sub.map((item) => item.label)).toEqual([
			"Gotowe wzory",
			"Tablice z logo",
			"Certyfikaty",
			"Cenniki",
		]);
		expect(sub[3]?.href).toBe("/sklep/gotowe-wzory/cenniki");
	});
});
