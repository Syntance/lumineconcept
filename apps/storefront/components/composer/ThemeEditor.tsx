"use client";

import { Loader2, Save } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import {
	FONT_LABELS,
	FONT_WHITELIST,
	WCAG_CONTRAST_PAIRS,
	contrastRatio,
	formatContrastRatio,
	meetsWcagAaNormal,
	type ThemeTokens,
} from "@/lib/composer/theme";
import { saveThemeTokensAction } from "@/magazyn/modules/content/content-actions";
import { cmsSaveSuccessMessage } from "@/magazyn/modules/content/cms-save-feedback";

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const COLOR_FIELDS: ReadonlyArray<{
	key: keyof ThemeTokens["colors"];
	label: string;
}> = [
	{ key: "background", label: "Tło strony" },
	{ key: "foreground", label: "Tekst główny" },
	{ key: "accent", label: "Akcent (CTA, linki)" },
	{ key: "accentForeground", label: "Tekst na akcentcie" },
	{ key: "muted", label: "Tło drugorzędne (muted)" },
	{ key: "mutedForeground", label: "Tekst drugorzędny" },
	{ key: "border", label: "Obramowania" },
	{ key: "primary", label: "Primary (shadcn)" },
	{ key: "primaryForeground", label: "Tekst na primary" },
	{ key: "brand500", label: "Brand 500 (miedź)" },
	{ key: "brand800", label: "Brand 800 (ciemny brąz)" },
];

type Props = {
	initial: ThemeTokens;
	onSaved?: () => void;
};

export function ThemeEditor({ initial, onSaved }: Props) {
	const [tokens, setTokens] = useState<ThemeTokens>(initial);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const contrastWarnings = useMemo(() => {
		return WCAG_CONTRAST_PAIRS.flatMap((pair) => {
			const fg = tokens.colors[pair.foregroundKey];
			const bg = tokens.colors[pair.backgroundKey];
			if (meetsWcagAaNormal(fg, bg)) return [];
			const ratio = contrastRatio(fg, bg);
			return [
				{
					id: pair.id,
					label: pair.label,
					ratio: formatContrastRatio(ratio),
				},
			];
		});
	}, [tokens.colors]);

	function updateColor(key: keyof ThemeTokens["colors"], value: string) {
		setTokens((prev) => ({
			...prev,
			colors: { ...prev.colors, [key]: value },
		}));
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSuccessMessage(null);

		startTransition(async () => {
			const result = await saveThemeTokensAction(tokens);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setSuccessMessage(cmsSaveSuccessMessage());
			onSaved?.();
		});
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-4">
			<fieldset
				data-cms-input="settings.themeTokens"
				className="flex flex-col gap-4 rounded-xl border border-border p-4"
			>
				<legend className="px-1 text-sm font-medium">Motyw (kolory OKLCH)</legend>
				<p className="text-xs text-muted-foreground">
					Kolory mapują się na zmienne CSS — bez inline stylów na stronie klienta. Format:{" "}
					<code className="text-[0.7rem]">oklch(L C H)</code>
				</p>

				<div className="grid gap-3 sm:grid-cols-2">
					{COLOR_FIELDS.map(({ key, label }) => (
						<label key={key} className="flex flex-col gap-1.5 text-sm">
							<span>{label}</span>
							<div className="flex items-center gap-2">
								<span
									className="size-9 shrink-0 rounded-md border border-border"
									style={{ backgroundColor: tokens.colors[key] }}
									aria-hidden
								/>
								<Input
									id={`theme-color-${key}`}
									aria-label={label}
									value={tokens.colors[key]}
									onChange={(e) => updateColor(key, e.target.value)}
									className="h-9 font-mono text-xs"
									spellCheck={false}
									autoComplete="off"
								/>
							</div>
						</label>
					))}
				</div>

				{contrastWarnings.length > 0 ? (
					<div
						role="status"
						className="rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-2 text-sm text-amber-950"
					>
						<p className="font-medium">Ostrzeżenie WCAG (kontrast &lt; 4.5:1)</p>
						<ul className="mt-1 list-inside list-disc text-xs">
							{contrastWarnings.map((w) => (
								<li key={w.id}>
									{w.label}: {w.ratio}
								</li>
							))}
						</ul>
						<p className="mt-1 text-xs opacity-80">
							Zapis nadal możliwy — popraw kontrast przed publikacją (wymóg EAA).
						</p>
					</div>
				) : (
					<p role="status" className="text-xs text-emerald-700">
						Kontrast par tekst/tło spełnia WCAG AA (≥ 4.5:1).
					</p>
				)}
			</fieldset>

			<fieldset
				data-cms-input="settings.themeTokens.fonts"
				className="flex flex-col gap-3 rounded-xl border border-border p-4"
			>
				<legend className="px-1 text-sm font-medium">Fonty (biała lista)</legend>
				<label className="flex flex-col gap-1.5 text-sm">
					<span id="theme-font-display-label">Nagłówki (display)</span>
					<select
						aria-labelledby="theme-font-display-label"
						value={tokens.fonts.display}
						onChange={(e) =>
							setTokens((prev) => ({
								...prev,
								fonts: { ...prev.fonts, display: e.target.value as ThemeTokens["fonts"]["display"] },
							}))
						}
						className={inputClass}
					>
						{FONT_WHITELIST.map((id) => (
							<option key={id} value={id}>
								{FONT_LABELS[id]}
							</option>
						))}
					</select>
				</label>
				<label className="flex flex-col gap-1.5 text-sm">
					<span>Treść (body)</span>
					<select
						value={tokens.fonts.body}
						onChange={(e) =>
							setTokens((prev) => ({
								...prev,
								fonts: { ...prev.fonts, body: e.target.value as ThemeTokens["fonts"]["body"] },
							}))
						}
						className={inputClass}
					>
						{FONT_WHITELIST.map((id) => (
							<option key={id} value={id}>
								{FONT_LABELS[id]}
							</option>
						))}
					</select>
				</label>
				<label className="flex flex-col gap-1.5 text-sm">
					<span>Serif (h4–h6)</span>
					<select
						value={tokens.fonts.serif}
						onChange={(e) =>
							setTokens((prev) => ({
								...prev,
								fonts: { ...prev.fonts, serif: e.target.value as ThemeTokens["fonts"]["serif"] },
							}))
						}
						className={inputClass}
					>
						{FONT_WHITELIST.map((id) => (
							<option key={id} value={id}>
								{FONT_LABELS[id]}
							</option>
						))}
					</select>
				</label>
			</fieldset>

			<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
				<legend className="px-1 text-sm font-medium">Zaokrąglenia</legend>
				<label className="flex flex-col gap-1.5 text-sm">
					<span>Promień (radius)</span>
					<select
						value={tokens.radius}
						onChange={(e) =>
							setTokens((prev) => ({
								...prev,
								radius: e.target.value as ThemeTokens["radius"],
							}))
						}
						className={inputClass}
					>
						<option value="0.5rem">Mały (0.5rem)</option>
						<option value="0.625rem">Domyślny (0.625rem)</option>
						<option value="0.75rem">Duży (0.75rem)</option>
						<option value="1rem">Bardzo duży (1rem)</option>
					</select>
				</label>
			</fieldset>

			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}
			{successMessage ? (
				<p role="status" className="text-sm text-emerald-600">
					{successMessage}
				</p>
			) : null}

			<Button type="submit" disabled={pending} className="h-10 w-fit gap-1.5">
				{pending ? (
					<Loader2 className="size-4 animate-spin" aria-hidden />
				) : (
					<Save className="size-4" aria-hidden />
				)}
				Zapisz motyw
			</Button>
		</form>
	);
}
