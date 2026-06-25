"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { uploadImagesAction } from "@magazyn/modules/products/actions";
import { resolveCmsAdminPreviewUrl } from "@/lib/content/asset-url";
import { MAX_CMS_UPLOAD_BYTES, MAX_CMS_UPLOAD_MB } from "@/lib/product-upload/constants";
import { CMS_ALLOWED_IMAGE_FORMATS_LABEL } from "@/lib/product-upload/cms-mime";
import { canCompressCmsImage, compressCmsImageForUpload } from "@/lib/product-upload/compress-cms-image";
import { cn } from "@magazyn/core/lib/cn";
import { isImageFile, useFileDropZone } from "@magazyn/core/hooks/use-file-drop-zone";

function isNetworkFetchError(error: unknown): boolean {
	return error instanceof TypeError && error.message === "Failed to fetch";
}

function isRetryableUploadError(message: string): boolean {
	return /413|za duży|limit|R2|nie powiódł|timeout|TIMEOUT/i.test(message);
}

/** CMS ≤ 20 MB — zawsze Server Action → R2 po stronie serwera (prod + dev). */
async function uploadCmsImageViaAction(file: File): Promise<string> {
	const formData = new FormData();
	formData.append("files", file);
	const result = await uploadImagesAction(formData);
	if (result.error) throw new Error(result.error);
	const url = result.urls[0];
	if (!url) throw new Error("Upload nie zwrócił adresu pliku.");
	return url;
}

async function uploadCmsImage(file: File): Promise<string> {
	try {
		return await uploadCmsImageViaAction(file);
	} catch (error) {
		const message = error instanceof Error ? error.message : "";
		if (canCompressCmsImage(file) && isRetryableUploadError(message)) {
			const compressed = await compressCmsImageForUpload(file);
			return uploadCmsImageViaAction(compressed);
		}
		throw error;
	}
}

type Props = {
	label: string;
	value: string;
	onChange: (url: string) => void;
	/** Wiele plików naraz (galeria CMS) — wywołuje onMultipleChange z listą URL. */
	multiple?: boolean;
	onMultipleChange?: (urls: string[]) => void;
	/** Nadpisuje domyślną podpowiedź pod polem (np. panel SEO). */
	description?: string;
};

export function OgImageField({
	label,
	value,
	onChange,
	multiple = false,
	onMultipleChange,
	description,
}: Props) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [previewBroken, setPreviewBroken] = useState(false);
	const previewUrl = value ? resolveCmsAdminPreviewUrl(value) ?? value : "";
	const batchMode = multiple && !!onMultipleChange;

	const uploadFiles = useCallback(
		async (files: File[]) => {
			const images = files.filter(isImageFile);
			if (images.length === 0) {
				setError(
					files.length === 0
						? "Nie wybrano pliku."
						: `Nierozpoznany format. Dozwolone: ${CMS_ALLOWED_IMAGE_FORMATS_LABEL}.`,
				);
				return;
			}

			const toUpload = batchMode ? images : images.slice(0, 1);
			for (const file of toUpload) {
				if (file.size > MAX_CMS_UPLOAD_BYTES) {
					setError(
						`Plik „${file.name}” jest za duży (maks. ${MAX_CMS_UPLOAD_MB} MB).`,
					);
					return;
				}
			}

			setUploading(true);
			setError(null);
			setPreviewBroken(false);
			try {
				const urls: string[] = [];
				for (const file of toUpload) {
					urls.push(await uploadCmsImage(file));
				}

				if (urls.length === 0) return;

				if (batchMode) {
					onMultipleChange(urls);
				} else {
					const url = urls[0];
					if (url) onChange(url);
				}
			} catch (uploadError) {
				const message =
					uploadError instanceof Error ? uploadError.message : "Upload nie powiódł się.";
				setError(
					isNetworkFetchError(uploadError)
						? "Połączenie przerwane podczas wysyłania pliku. Spróbuj ponownie za chwilę."
						: message || "Upload nie powiódł się. Sprawdź połączenie i spróbuj ponownie.",
				);
			} finally {
				setUploading(false);
			}
		},
		[batchMode, onChange, onMultipleChange],
	);

	const { isDragging, dropZoneProps } = useFileDropZone({
		disabled: uploading,
		accept: isImageFile,
		onDropFiles: (files) => {
			void uploadFiles(files);
		},
	});

	return (
		<div className="flex flex-col gap-2">
			<span className="text-sm font-medium">{label}</span>
			<div
				{...dropZoneProps}
				className={cn(
					"flex flex-wrap items-start gap-3 rounded-lg p-1 transition-colors",
					isDragging && "bg-primary/5 ring-2 ring-primary ring-offset-2",
					batchMode && "min-h-[6.5rem] w-full rounded-lg border border-dashed border-border p-3",
					batchMode && isDragging && "border-primary bg-primary/5",
				)}
			>
				{previewUrl ? (
					<div className="relative h-24 w-40 overflow-hidden rounded-lg border border-border bg-muted">
						<Image
							src={previewUrl}
							alt=""
							fill
							sizes="160px"
							className="object-cover"
							unoptimized
							onError={() => setPreviewBroken(true)}
						/>
						{previewBroken ? (
							<div className="absolute inset-0 flex items-center justify-center bg-muted p-2 text-center text-[10px] leading-snug text-muted-foreground">
								Podgląd niedostępny
							</div>
						) : null}
						<button
							type="button"
							aria-label="Usuń obraz"
							onClick={() => {
								setPreviewBroken(false);
								onChange("");
							}}
							className="absolute right-1 top-1 grid size-6 place-items-center rounded-md bg-background/80 text-muted-foreground hover:text-destructive"
						>
							<X className="size-3.5" aria-hidden />
						</button>
					</div>
				) : null}
				<label
					className={cn(
						"grid cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted",
						batchMode ? "h-20 min-w-[10rem] flex-1 px-4" : "h-24 w-40",
						isDragging && "border-primary bg-primary/5",
						uploading && "pointer-events-none opacity-60",
					)}
				>
					<input
						type="file"
						accept="image/*,.heic,.heif"
						multiple={batchMode}
						className="sr-only"
						disabled={uploading}
						onChange={(e) => {
							void uploadFiles(Array.from(e.target.files ?? []));
							e.target.value = "";
						}}
					/>
					{uploading ? (
						<Loader2 className="size-5 animate-spin" aria-hidden />
					) : batchMode ? (
						<span className="text-center text-xs leading-snug">
							<ImagePlus className="mx-auto mb-1 size-5" aria-hidden />
							Przeciągnij zdjęcia lub kliknij
						</span>
					) : (
						<ImagePlus className="size-5" aria-hidden />
					)}
				</label>
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
			<p className="text-xs text-muted-foreground">
				{description ??
					(batchMode
						? "Zdjęcia w pełnej jakości (do 20 MB). Na stronie sklepu pojawią się po Redeploy (~2–3 min)."
						: "Pełna jakość — bez kompresji w panelu. Zapisz formularz, potem Redeploy u góry (~2–3 min na prod).")}
			</p>
		</div>
	);
}
