"use client";

import { ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import type { ContentBlockKey } from "@magazyn/core/config/types";
import type {
	AboutPageContent,
	FaqItem,
	GalleryPhoto,
	HeroContent,
	BrandingCtaContent,
	PageContent,
	Testimonial,
} from "@/lib/content/types";
import { ABOUT_HERO_DEFAULT } from "@/lib/content/defaults";
import { isCmsImageUnoptimized, resolveCmsAdminPreviewUrl } from "@/lib/content/asset-url";
import { usePreventWindowFileDrop } from "@magazyn/core/hooks/use-prevent-window-file-drop";
import { savePageContentAction } from "./content-actions";
import { cmsGallerySaveSuccessMessage, cmsSaveSuccessMessage } from "./cms-save-feedback";
import { newCmsId } from "./cms-id";
import { OgImageField } from "./seo/og-image-field";

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Props = {
	pageId: string;
	path: string;
	blocks: ContentBlockKey[];
	initial: PageContent;
};

export function PageContentEditor({ pageId, path, blocks, initial }: Props) {
	const router = useRouter();
	const [content, setContent] = useState<PageContent>(initial);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const [gallerySaving, startGallerySave] = useTransition();
	usePreventWindowFileDrop();

	function saveContent(
		next: PageContent,
		options: { message?: string; transition?: typeof startTransition } = {},
	) {
		const runSave = options.transition ?? startTransition;
		setError(null);
		runSave(async () => {
			const result = await savePageContentAction(pageId, path, next);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setSuccessMessage(options.message ?? cmsSaveSuccessMessage());
			router.refresh();
		});
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSuccessMessage(null);
		saveContent(content);
	}

	function onGalleryChange(gallery: GalleryPhoto[]) {
		let next: PageContent = content;
		setContent((current) => {
			next = { ...current, gallery };
			return next;
		});
		saveContent(next, {
			message: cmsGallerySaveSuccessMessage(),
			transition: startGallerySave,
		});
	}

	return (
		<form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
			{blocks.includes("hero") ? (
				pageId === "o-nas" ? (
					<AboutHeroEditor
						value={content.hero}
						onChange={(hero) => setContent((c) => ({ ...c, hero }))}
					/>
				) : (
					<HeroEditor
						value={content.hero}
						onChange={(hero) => setContent((c) => ({ ...c, hero }))}
					/>
				)
			) : null}
			{blocks.includes("about") ? (
				<AboutSectionsEditor
					value={content.about}
					onChange={(about) => setContent((c) => ({ ...c, about }))}
				/>
			) : null}
			{blocks.includes("brandingCta") ? (
				<BrandingCtaEditor
					value={content.brandingCta}
					onChange={(brandingCta) => setContent((c) => ({ ...c, brandingCta }))}
				/>
			) : null}
			{blocks.includes("testimonials") ? (
				<TestimonialsEditor
					value={content.testimonials ?? []}
					onChange={(testimonials) => setContent((c) => ({ ...c, testimonials }))}
				/>
			) : null}
			{blocks.includes("faq") ? (
				<FaqEditor value={content.faq ?? []} onChange={(faq) => setContent((c) => ({ ...c, faq }))} />
			) : null}
			{blocks.includes("gallery") ? (
				<GalleryEditor
					value={content.gallery ?? []}
					onChange={onGalleryChange}
					saving={gallerySaving}
				/>
			) : null}
			{blocks.includes("categoryTiles") ? (
				<CategoryTilesEditor
					value={content.categoryTiles ?? []}
					onChange={(categoryTiles) => setContent((c) => ({ ...c, categoryTiles }))}
				/>
			) : null}
			{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
			{successMessage ? (
				<p role="status" className="text-sm text-emerald-600">
					{successMessage}
				</p>
			) : null}
			<Button type="submit" disabled={pending || gallerySaving} className="h-10 w-fit gap-1.5">
				{pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
				Zapisz treści
			</Button>
		</form>
	);
}

function AboutHeroEditor({
	value,
	onChange,
}: {
	value?: HeroContent;
	onChange: (v: HeroContent) => void;
}) {
	const hero = { ...ABOUT_HERO_DEFAULT, ...value };

	return (
		<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
			<legend className="px-1 text-sm font-medium">Hero — O nas</legend>
			<Input
				value={hero.headline}
				onChange={(e) => onChange({ ...hero, headline: e.target.value })}
				placeholder="Nagłówek"
				className="h-10"
			/>
			<Input
				value={hero.subtitle ?? ""}
				onChange={(e) => onChange({ ...hero, subtitle: e.target.value })}
				placeholder="Podtytuł"
				className="h-10"
			/>
			<OgImageField
				label="Tło hero"
				value={hero.desktopImageUrl ?? ""}
				onChange={(url) => onChange({ ...hero, desktopImageUrl: url })}
			/>
		</fieldset>
	);
}

function AboutSectionsEditor({
	value,
	onChange,
}: {
	value?: AboutPageContent;
	onChange: (v: AboutPageContent) => void;
}) {
	const about = value ?? {};

	function paragraphsToText(paragraphs: string[] | undefined): string {
		return (paragraphs ?? []).join("\n\n");
	}

	function textToParagraphs(text: string): string[] {
		return text
			.split(/\n\s*\n/)
			.map((p) => p.trim())
			.filter((p) => p.length > 0);
	}

	return (
		<fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4">
			<legend className="px-1 text-sm font-medium">Sekcje — O nas</legend>
			<Input
				value={about.sideCaption ?? ""}
				onChange={(e) => onChange({ ...about, sideCaption: e.target.value })}
				placeholder="Tekst boczny (pionowy)"
				className="h-10"
			/>
			<div className="flex flex-col gap-3 rounded-lg border border-border p-3">
				<p className="text-sm font-medium">Sekcja „my”</p>
				<Input
					value={about.introHeading ?? ""}
					onChange={(e) => onChange({ ...about, introHeading: e.target.value })}
					placeholder="Nagłówek sekcji"
					className="h-10"
				/>
				<textarea
					value={paragraphsToText(about.introParagraphs)}
					onChange={(e) => onChange({ ...about, introParagraphs: textToParagraphs(e.target.value) })}
					rows={6}
					className={inputClass}
					placeholder="Akapitów — oddziel pustą linią"
				/>
				<Input
					value={about.introLabel ?? ""}
					onChange={(e) => onChange({ ...about, introLabel: e.target.value })}
					placeholder="Etykieta pod zdjęciem"
					className="h-10"
				/>
				<Input
					value={about.introImageAlt ?? ""}
					onChange={(e) => onChange({ ...about, introImageAlt: e.target.value })}
					placeholder="Alt zdjęcia intro"
					className="h-10"
				/>
				<OgImageField
					label="Zdjęcie intro"
					value={about.introImageUrl ?? ""}
					onChange={(url) => onChange({ ...about, introImageUrl: url })}
				/>
			</div>
			<div className="flex flex-col gap-3 rounded-lg border border-border p-3">
				<p className="text-sm font-medium">Sekcja „nasza misja”</p>
				<textarea
					value={paragraphsToText(about.missionParagraphs)}
					onChange={(e) => onChange({ ...about, missionParagraphs: textToParagraphs(e.target.value) })}
					rows={6}
					className={inputClass}
					placeholder="Akapitów — oddziel pustą linią"
				/>
				<Input
					value={about.missionLabel ?? ""}
					onChange={(e) => onChange({ ...about, missionLabel: e.target.value })}
					placeholder="Etykieta nad zdjęciem"
					className="h-10"
				/>
				<Input
					value={about.missionImageAlt ?? ""}
					onChange={(e) => onChange({ ...about, missionImageAlt: e.target.value })}
					placeholder="Alt zdjęcia misji"
					className="h-10"
				/>
				<OgImageField
					label="Zdjęcie misji"
					value={about.missionImageUrl ?? ""}
					onChange={(url) => onChange({ ...about, missionImageUrl: url })}
				/>
			</div>
			<div className="flex flex-col gap-3 rounded-lg border border-border p-3">
				<p className="text-sm font-medium">Domknięcie strony</p>
				<Input
					value={about.closingImageAlt ?? ""}
					onChange={(e) => onChange({ ...about, closingImageAlt: e.target.value })}
					placeholder="Alt zdjęcia domknięcia"
					className="h-10"
				/>
				<OgImageField
					label="Zdjęcie domknięcia"
					value={about.closingImageUrl ?? ""}
					onChange={(url) => onChange({ ...about, closingImageUrl: url })}
				/>
			</div>
		</fieldset>
	);
}

function HeroEditor({ value, onChange }: { value?: HeroContent; onChange: (v: HeroContent) => void }) {
	const hero = value ?? {
		headline: "",
		description: "",
		ctaLabel: "",
		ctaHref: "",
	};

	return (
		<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
			<legend className="px-1 text-sm font-medium">Hero</legend>
			<Input value={hero.headline} onChange={(e) => onChange({ ...hero, headline: e.target.value })} placeholder="Nagłówek" className="h-10" />
			<Input value={hero.subtitle ?? ""} onChange={(e) => onChange({ ...hero, subtitle: e.target.value })} placeholder="Podtytuł" className="h-10" />
			<textarea value={hero.description} onChange={(e) => onChange({ ...hero, description: e.target.value })} rows={2} className={inputClass} placeholder="Opis" />
			<div className="grid gap-3 sm:grid-cols-2">
				<Input value={hero.ctaLabel} onChange={(e) => onChange({ ...hero, ctaLabel: e.target.value })} placeholder="CTA" className="h-10" />
				<Input value={hero.ctaHref} onChange={(e) => onChange({ ...hero, ctaHref: e.target.value })} placeholder="Link CTA" className="h-10" />
			</div>
			<OgImageField label="Tło desktop" value={hero.desktopImageUrl ?? ""} onChange={(url) => onChange({ ...hero, desktopImageUrl: url })} />
			<OgImageField label="Tło mobile" value={hero.mobileImageUrl ?? ""} onChange={(url) => onChange({ ...hero, mobileImageUrl: url })} />
		</fieldset>
	);
}

function BrandingCtaEditor({
	value,
	onChange,
}: {
	value?: BrandingCtaContent;
	onChange: (v: BrandingCtaContent) => void;
}) {
	const branding = value ?? {};
	return (
		<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
			<legend className="px-1 text-sm font-medium">Sekcja branding (Footer CTA)</legend>
			<OgImageField
				label="Tło desktop"
				value={branding.desktopBackgroundUrl ?? ""}
				onChange={(url) => onChange({ ...branding, desktopBackgroundUrl: url })}
			/>
		</fieldset>
	);
}

function TestimonialsEditor({
	value,
	onChange,
}: {
	value: Testimonial[];
	onChange: (v: Testimonial[]) => void;
}) {
	function add() {
		onChange([
			...value,
			{
				id: newCmsId("t"),
				name: "",
				company: "",
				quote: "",
				rating: 5,
				order: value.length,
			},
		]);
	}

	function update(index: number, patch: Partial<Testimonial>) {
		onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
	}

	function remove(index: number) {
		onChange(value.filter((_, i) => i !== index));
	}

	function move(index: number, dir: -1 | 1) {
		const next = [...value];
		const target = index + dir;
		if (target < 0 || target >= next.length) return;
		const a = next[index];
		const b = next[target];
		if (!a || !b) return;
		next[index] = b;
		next[target] = a;
		onChange(next.map((item, i) => ({ ...item, order: i })));
	}

	return (
		<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
			<legend className="px-1 text-sm font-medium">Opinie klientów</legend>
			{value.map((item, index) => (
				<div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
					<div className="flex gap-2">
						<Input value={item.name} onChange={(e) => update(index, { name: e.target.value })} placeholder="Imię" className="h-9" />
						<Input value={item.company} onChange={(e) => update(index, { company: e.target.value })} placeholder="Firma" className="h-9" />
					</div>
					<textarea value={item.quote} onChange={(e) => update(index, { quote: e.target.value })} rows={2} className={inputClass} placeholder="Cytat" />
					<OgImageField label="Zdjęcie" value={item.imageUrl ?? ""} onChange={(url) => update(index, { imageUrl: url })} />
					<div className="flex gap-2">
						<Button type="button" variant="ghost" size="sm" onClick={() => move(index, -1)} aria-label="Wyżej"><ChevronUp className="size-4" /></Button>
						<Button type="button" variant="ghost" size="sm" onClick={() => move(index, 1)} aria-label="Niżej"><ChevronDown className="size-4" /></Button>
						<Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} aria-label="Usuń"><Trash2 className="size-4 text-destructive" /></Button>
					</div>
				</div>
			))}
			<Button type="button" variant="outline" size="sm" onClick={add} className="w-fit gap-1"><Plus className="size-4" />Dodaj opinię</Button>
		</fieldset>
	);
}

function FaqEditor({ value, onChange }: { value: FaqItem[]; onChange: (v: FaqItem[]) => void }) {
	function add() {
		onChange([...value, { id: newCmsId("faq"), question: "", answer: "", order: value.length }]);
	}

	function update(index: number, patch: Partial<FaqItem>) {
		onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
	}

	function remove(index: number) {
		onChange(value.filter((_, i) => i !== index));
	}

	return (
		<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
			<legend className="px-1 text-sm font-medium">FAQ</legend>
			{value.map((item, index) => (
				<div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
					<Input value={item.question} onChange={(e) => update(index, { question: e.target.value })} placeholder="Pytanie" className="h-9" />
					<textarea value={item.answer} onChange={(e) => update(index, { answer: e.target.value })} rows={3} className={inputClass} placeholder="Odpowiedź" />
					<Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="w-fit gap-1 text-destructive"><Trash2 className="size-4" />Usuń</Button>
				</div>
			))}
			<Button type="button" variant="outline" size="sm" onClick={add} className="w-fit gap-1"><Plus className="size-4" />Dodaj FAQ</Button>
		</fieldset>
	);
}

function GalleryEditor({
	value,
	onChange,
	saving = false,
}: {
	value: GalleryPhoto[];
	onChange: (v: GalleryPhoto[]) => void;
	saving?: boolean;
}) {
	function addMany(urls: string[]) {
		if (urls.length === 0) return;
		const startOrder = value.length;
		onChange([
			...value,
			...urls.map((imageUrl, index) => ({
				id: newCmsId("g"),
				imageUrl,
				order: startOrder + index,
			})),
		]);
	}

	function remove(index: number) {
		onChange(value.filter((_, i) => i !== index));
	}

	return (
		<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
			<legend className="px-1 text-sm font-medium">Galeria realizacji</legend>
			{saving ? (
				<p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
					<Loader2 className="size-3.5 animate-spin" aria-hidden />
					Zapisywanie galerii…
				</p>
			) : null}
			<div className="flex flex-wrap gap-2">
				{value.map((photo, index) => {
					const previewUrl = resolveCmsAdminPreviewUrl(photo.imageUrl) ?? photo.imageUrl;
					return (
					<div key={photo.id} className="relative size-20 overflow-hidden rounded-lg border border-border">
						<Image
							src={previewUrl}
							alt={photo.alt ?? ""}
							fill
							sizes="80px"
							className="object-cover"
							unoptimized={isCmsImageUnoptimized(previewUrl)}
						/>
						<button type="button" onClick={() => remove(index)} className="absolute right-0 top-0 bg-background/80 p-0.5" aria-label="Usuń">
							<Trash2 className="size-3 text-destructive" />
						</button>
					</div>
					);
				})}
			</div>
			<OgImageField
				label="Dodaj zdjęcia"
				value=""
				onChange={() => {}}
				multiple
				onMultipleChange={addMany}
			/>
		</fieldset>
	);
}

function CategoryTilesEditor({
	value,
	onChange,
}: {
	value: NonNullable<PageContent["categoryTiles"]>;
	onChange: (v: NonNullable<PageContent["categoryTiles"]>) => void;
}) {
	function update(index: number, patch: Partial<(typeof value)[number]>) {
		onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
	}

	return (
		<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
			<legend className="px-1 text-sm font-medium">Kafelki kategorii</legend>
			{value.map((tile, index) => (
				<div key={`${tile.href}-${index}`} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
					<Input value={tile.title} onChange={(e) => update(index, { title: e.target.value })} placeholder="Tytuł" className="h-9" />
					<Input value={tile.cta} onChange={(e) => update(index, { cta: e.target.value })} placeholder="CTA" className="h-9" />
					<Input value={tile.href} onChange={(e) => update(index, { href: e.target.value })} placeholder="Link" className="h-9 sm:col-span-2" />
					<div className="sm:col-span-2">
						<OgImageField label="Obraz" value={tile.imageUrl} onChange={(url) => update(index, { imageUrl: url })} />
					</div>
				</div>
			))}
		</fieldset>
	);
}
