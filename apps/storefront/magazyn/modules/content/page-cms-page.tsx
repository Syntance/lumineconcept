import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "@magazyn/magazyn.config";
import { Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentBundle } from "./content-store";
import { CmsSettingsClient } from "./cms-settings-client";
import { listProductOptionsForCms } from "./product-options";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ pageId: string }> };

export default async function CmsPageEditorPage({ params }: Props) {
	const { pageId } = await params;
	const page = magazynConfig.content.pages.find((p) => p.id === pageId);
	if (!page) notFound();

	const needsProducts = page.blocks.includes("bestsellers");
	const [bundle, productOptions] = await Promise.all([
		loadAdmin(getContentBundle),
		needsProducts ? listProductOptionsForCms() : Promise.resolve([]),
	]);

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="font-serif text-2xl text-foreground">CMS — {page.label}</h1>
					<p className="mt-1 text-sm text-muted-foreground">{page.path}</p>
				</div>
				<Link
					href={`${magazynConfig.basePath}/panel/cms/podglad/${page.id}`}
					className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
				>
					<Eye className="size-4" aria-hidden />
					Edytuj na żywo
				</Link>
			</header>
			<CmsSettingsClient
				siteSettings={bundle.siteSettings}
				pageContent={bundle.pageContent}
				globalContent={bundle.globalContent}
				pages={magazynConfig.content.pages}
				activeTab={pageId}
				productOptions={productOptions}
			/>
		</div>
	);
}
