import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "@magazyn/magazyn.config";
import { notFound } from "next/navigation";
import type { PageContentMap } from "@/lib/content/types";
import { getContentBundle } from "./content-store";
import { migratePageContentToSections } from "@/lib/composer/sections/migrate";
import { getPageSectionsHistoryForAdmin } from "./content-store";
import type { ContentPageId } from "@/lib/content/types";
import { listProductOptionsForCms } from "./product-options";
import { LivePreviewClient } from "./live-preview-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ pageId: string }> };

/** Trasa panelu: /magazyn/panel/cms/podglad/[pageId] — edycja na żywo. */
export default async function CmsLivePreviewPage({ params }: Props) {
	const { pageId } = await params;
	const page = magazynConfig.content.pages.find((p) => p.id === pageId);
	if (!page) notFound();

	const needsProducts = page.blocks.includes("bestsellers");
	const [bundle, productOptions, sectionsHistory] = await Promise.all([
		loadAdmin(getContentBundle),
		needsProducts ? listProductOptionsForCms() : Promise.resolve([]),
		loadAdmin(() => getPageSectionsHistoryForAdmin(page.id as ContentPageId)),
	]);

	const pageContent = bundle.pageContent[page.id as keyof PageContentMap] ?? {};
	const draftSections = bundle.pageSectionsDraft[page.id as ContentPageId];
	const initialSections =
		draftSections?.length
			? draftSections
			: migratePageContentToSections(page.id as ContentPageId, pageContent);

	return (
		<LivePreviewClient
			page={page}
			initial={pageContent}
			initialSections={initialSections}
			sectionsHistory={sectionsHistory}
			siteSettings={bundle.siteSettings}
			globalContent={bundle.globalContent}
			themeTokens={bundle.themeTokens}
			productOptions={productOptions}
		/>
	);
}
