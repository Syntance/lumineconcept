"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import type { GlobalContent, SiteSettings } from "@/lib/content/types";
import {
	saveGlobalContentAction,
	saveGlobalSiteSettingsAction,
} from "./content-actions";
import { cmsSaveSuccessMessage } from "./cms-save-feedback";
import { newCmsId } from "./cms-id";
import { SalonLogosEditor } from "./salon-logos-editor";
import { OgImageField } from "./seo/og-image-field";

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Props = {
	siteSettings: SiteSettings;
	globalContent: GlobalContent;
};

export function GlobalContentEditor({ siteSettings: initialSettings, globalContent: initialGlobal }: Props) {
	const [settings, setSettings] = useState(initialSettings);
	const [global, setGlobal] = useState(initialGlobal);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSuccessMessage(null);

		if (settings.announcementBar?.enabled && !settings.announcementBar.text?.trim()) {
			setError("Pasek informacyjny: wpisz tekst lub odznacz „Włączony”.");
			return;
		}

		startTransition(async () => {
			const settingsResult = await saveGlobalSiteSettingsAction(settings);
			if (!settingsResult.ok) {
				setError(settingsResult.error);
				return;
			}
			const globalResult = await saveGlobalContentAction(global, ["/", "/sklep"]);
			if (!globalResult.ok) {
				setError(globalResult.error);
				return;
			}
			const mediaQueued =
				Boolean(settingsResult.mediaPublishQueued) || Boolean(globalResult.mediaPublishQueued);
			setSuccessMessage(cmsSaveSuccessMessage(mediaQueued));
		});
	}

	return (
		<form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
			<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
				<legend className="px-1 text-sm font-medium">Pasek informacyjny</legend>
				<p className="text-xs text-muted-foreground">
					Tekst publikuje się od razu po zapisie (revalidate cache). Redeploy Vercel nie jest
					potrzebny.
				</p>
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={settings.announcementBar?.enabled ?? false}
						onChange={(e) =>
							setSettings((s) => ({
								...s,
								announcementBar: {
									enabled: e.target.checked,
									text: s.announcementBar?.text ?? "",
									link: s.announcementBar?.link,
								},
							}))
						}
						className="size-4"
					/>
					Włączony
				</label>
				<Input
					value={settings.announcementBar?.text ?? ""}
					onChange={(e) =>
						setSettings((s) => ({
							...s,
							announcementBar: {
								enabled: s.announcementBar?.enabled ?? true,
								text: e.target.value,
								link: s.announcementBar?.link,
							},
						}))
					}
					placeholder="Tekst paska"
					className="h-10"
				/>
			</fieldset>

			<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
				<legend className="px-1 text-sm font-medium">Trust bar</legend>
				<Input value={settings.trustBar?.followers ?? ""} onChange={(e) => setSettings((s) => ({ ...s, trustBar: { ...s.trustBar, followers: e.target.value } }))} placeholder="Obserwujący" className="h-10" />
				<Input value={settings.trustBar?.realizations ?? ""} onChange={(e) => setSettings((s) => ({ ...s, trustBar: { ...s.trustBar, realizations: e.target.value } }))} placeholder="Realizacje" className="h-10" />
				<Input value={settings.trustBar?.shippingLabel ?? ""} onChange={(e) => setSettings((s) => ({ ...s, trustBar: { ...s.trustBar, shippingLabel: e.target.value } }))} placeholder="Label wysyłki" className="h-10" />
			</fieldset>

			<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
				<legend className="px-1 text-sm font-medium">Checkout callout (PDP)</legend>
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={settings.checkoutCallout?.enabled ?? false} onChange={(e) => setSettings((s) => ({ ...s, checkoutCallout: { ...s.checkoutCallout, enabled: e.target.checked } }))} className="size-4" />
					Włączony
				</label>
				<Input value={settings.checkoutCallout?.title ?? ""} onChange={(e) => setSettings((s) => ({ ...s, checkoutCallout: { ...s.checkoutCallout, title: e.target.value } }))} placeholder="Nagłówek" className="h-10" />
				<textarea value={settings.checkoutCallout?.message ?? ""} onChange={(e) => setSettings((s) => ({ ...s, checkoutCallout: { ...s.checkoutCallout, message: e.target.value } }))} rows={3} className={inputClass} placeholder="Treść" />
			</fieldset>

			<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
				<legend className="px-1 text-sm font-medium">Stopka i social media</legend>
				<textarea
					value={settings.footerText ?? ""}
					onChange={(e) => setSettings((s) => ({ ...s, footerText: e.target.value }))}
					rows={2}
					className={inputClass}
					placeholder="Tekst copyright w stopce (opcjonalnie)"
				/>
				<Input
					value={settings.socialLinks?.instagram ?? ""}
					onChange={(e) =>
						setSettings((s) => ({
							...s,
							socialLinks: { ...s.socialLinks, instagram: e.target.value },
						}))
					}
					placeholder="Instagram URL"
					className="h-10"
				/>
				<Input
					value={settings.socialLinks?.facebook ?? ""}
					onChange={(e) =>
						setSettings((s) => ({
							...s,
							socialLinks: { ...s.socialLinks, facebook: e.target.value },
						}))
					}
					placeholder="Facebook URL"
					className="h-10"
				/>
				<Input
					value={settings.socialLinks?.tiktok ?? ""}
					onChange={(e) =>
						setSettings((s) => ({
							...s,
							socialLinks: { ...s.socialLinks, tiktok: e.target.value },
						}))
					}
					placeholder="TikTok URL (opcjonalnie)"
					className="h-10"
				/>
			</fieldset>

			<SalonLogosEditor
				value={global.salonLogos ?? []}
				onChange={(salonLogos) => setGlobal((g) => ({ ...g, salonLogos }))}
			/>

			<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
				<legend className="px-1 text-sm font-medium">Instagram (HP, max 6)</legend>
				{(global.instagramTiles ?? []).map((tile, index) => (
					<div key={tile.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
						<Input value={tile.postUrl} onChange={(e) => setGlobal((g) => ({ ...g, instagramTiles: (g.instagramTiles ?? []).map((t, i) => (i === index ? { ...t, postUrl: e.target.value } : t)) }))} placeholder="URL posta" className="h-9" />
						<OgImageField label="Miniatura" value={tile.imageUrl} onChange={(url) => setGlobal((g) => ({ ...g, instagramTiles: (g.instagramTiles ?? []).map((t, i) => (i === index ? { ...t, imageUrl: url } : t)) }))} />
						<Button type="button" variant="ghost" size="sm" onClick={() => setGlobal((g) => ({ ...g, instagramTiles: (g.instagramTiles ?? []).filter((_, i) => i !== index) }))} className="w-fit text-destructive"><Trash2 className="size-4" />Usuń</Button>
					</div>
				))}
				<Button type="button" variant="outline" size="sm" disabled={(global.instagramTiles?.length ?? 0) >= 6} onClick={() => setGlobal((g) => ({ ...g, instagramTiles: [...(g.instagramTiles ?? []), { id: newCmsId("ig"), postUrl: "", imageUrl: "" }] }))} className="w-fit gap-1"><Plus className="size-4" />Dodaj kafelek</Button>
			</fieldset>

			{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
			{successMessage ? (
				<p role="status" className="text-sm text-emerald-600">
					{successMessage}
				</p>
			) : null}
			<Button type="submit" disabled={pending} className="h-10 w-fit gap-1.5">
				{pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
				Zapisz treści globalne
			</Button>
		</form>
	);
}
