"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { uploadImagesAction } from "@magazyn/modules/products/actions";
import { cn } from "@magazyn/core/lib/cn";

type Props = {
	label: string;
	value: string;
	onChange: (url: string) => void;
};

import { isCmsImageUnoptimized, resolveCmsAssetUrl } from "@/lib/content/asset-url";

export function OgImageField({ label, value, onChange }: Props) {
	const fileId = useId();
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const previewUrl = value ? resolveCmsAssetUrl(value) ?? value : "";

	async function onUpload(files: FileList | null) {
		if (!files?.length) return;
		setUploading(true);
		setError(null);
		try {
			const formData = new FormData();
			for (const file of Array.from(files)) formData.append("files", file);
			const result = await uploadImagesAction(formData);
			if (result.error) {
				setError(result.error);
				return;
			}
			const url = result.urls[0];
			if (url) onChange(url);
		} catch {
			setError("Upload nie powiódł się. Spróbuj ponownie lub mniejszy plik.");
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<span className="text-sm font-medium">{label}</span>
			<div className="flex flex-wrap items-start gap-3">
				{previewUrl ? (
					<div className="relative h-24 w-40 overflow-hidden rounded-lg border border-border bg-muted">
						<Image
							src={previewUrl}
							alt=""
							fill
							sizes="160px"
							className="object-cover"
							unoptimized={isCmsImageUnoptimized(previewUrl)}
						/>
						<button
							type="button"
							aria-label="Usuń obraz OG"
							onClick={() => onChange("")}
							className="absolute right-1 top-1 grid size-6 place-items-center rounded-md bg-background/80 text-muted-foreground hover:text-destructive"
						>
							<X className="size-3.5" aria-hidden />
						</button>
					</div>
				) : null}
				<label
					htmlFor={fileId}
					className={cn(
						"grid h-24 w-40 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted",
						uploading && "pointer-events-none opacity-60",
					)}
				>
					{uploading ? (
						<Loader2 className="size-5 animate-spin" aria-hidden />
					) : (
						<ImagePlus className="size-5" aria-hidden />
					)}
				</label>
				<input
					id={fileId}
					type="file"
					accept="image/*"
					className="sr-only"
					disabled={uploading}
					onChange={(e) => {
						void onUpload(e.target.files);
						e.target.value = "";
					}}
				/>
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
			<p className="text-xs text-muted-foreground">Zalecane 1200×630 px (WebP lub JPG).</p>
		</div>
	);
}
