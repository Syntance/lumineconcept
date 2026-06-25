"use client";

import type { ContentPageConfig } from "@magazyn/core/config/types";
import type { GlobalContent, PageContentMap, SiteSettings } from "@/lib/content/types";
import { GlobalContentEditor } from "./global-content-editor";
import { PageContentEditor } from "./page-content-editor";
import { CmsRedeployButton } from "./cms-redeploy-button";
import { CmsNav } from "./cms-nav";
import type { CmsProductOption } from "./product-options";

type Props = {
	siteSettings: SiteSettings;
	pageContent: PageContentMap;
	globalContent: GlobalContent;
	pages: ContentPageConfig[];
	activeTab: "global" | string;
	productOptions?: CmsProductOption[];
};

export function CmsSettingsClient({
	siteSettings,
	pageContent,
	globalContent,
	pages,
	activeTab,
	productOptions = [],
}: Props) {
	const activePage = pages.find((p) => p.id === activeTab);

	return (
		<div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
			<CmsNav pages={pages} />
			<div className="min-w-0 flex-1 flex flex-col gap-4">
				<CmsRedeployButton />
				{activeTab === "global" ? (
					<GlobalContentEditor siteSettings={siteSettings} globalContent={globalContent} />
				) : activePage ? (
					<PageContentEditor
						pageId={activePage.id}
						path={activePage.path}
						blocks={activePage.blocks}
						initial={pageContent[activePage.id as keyof PageContentMap] ?? {}}
						productOptions={activePage.blocks.includes("bestsellers") ? productOptions : []}
					/>
				) : null}
			</div>
		</div>
	);
}
