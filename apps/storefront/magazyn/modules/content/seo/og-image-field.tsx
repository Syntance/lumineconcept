"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useId, useState } from "react";
import { isCmsImageUnoptimized, resolveCmsAdminPreviewUrl } from "@/lib/content/asset-url";
import { MAX_CMS_UPLOAD_BYTES, MAX_CMS_UPLOAD_MB } from "@/lib/product-upload/constants";
import { cn } from "@magazyn/core/lib/cn";
import { isImageFile, useFileDropZone } from "@magazyn/core/hooks/use-file-drop-zone";

const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence"]);

function isHeicFile(file: File): boolean {
	const type = file.type.toLowerCase();
	if (HEIC_TYPES.has(type)) return true;
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	return ext === "heic" || ext === "heif";
}

async function readUploadResponse(
	res: Response,
): Promise<{ ok: boolean; urls: string[]; error: string | null }> {
	const contentType = res.headers.get("content-type") ?? "";
	const text = await res.text();

	if (contentType.includes("application/json") && text) {
		try {
			const payload = JSON.parse(text) as { urls?: string[]; error?: string | null };
			const error = payload.error ?? null;
			return {
				ok: res.ok && !error,
				urls: payload.urls ?? [],
				error: error ?? (res.ok ? null : "Upload nie powiódł się. Spróbuj ponownie."),
			};
		} catch {
			// niepoprawny JSON — poniżej komunikat ogólny
		}
	}

	if (res.status === 413) {
		return {
			ok: false,
			urls: [],
			error: `Plik jest za duży dla serwera. Zapisz jako JPG/WebP (do ${MAX_CMS_UPLOAD_MB} MB).`,
		};
	}
	if (res.status === 401) {
		return { ok: false, urls: [], error: "Sesja wygasła — zaloguj się ponownie." };
	}
	if (res.status >= 502) {
		return {
			ok: false,
			urls: [],
			error: "Serwer chwilowo niedostępny. Odśwież stronę i spróbuj ponownie.",
		};
	}

	return {
		ok: false,
		urls: [],
		error: `Upload nie powiódł się — serwer zwrócił nieoczekiwaną odpowiedź. Spróbuj JPG/WebP do ${MAX_CMS_UPLOAD_MB} MB.`,
	};
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
	const fileId = useId();
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const previewUrl = value ? resolveCmsAdminPreviewUrl(value) ?? value : "";
	const batchMode = multiple && !!onMultipleChange;

	const uploadFiles = useCallback(
		async (files: File[]) => {
			const images = files.filter(isImageFile);
			if (images.length === 0) return;

			const toUpload = batchMode ? images : images.slice(0, 1);
			for (const file of toUpload) {
				if (isHeicFile(file)) {
					setError(
						"Format HEIC (iPhone) nie jest obsługiwany. Wyeksportuj zdjęcie jako JPG lub WebP.",
					);
					return;
				}
				if (file.size > MAX_CMS_UPLOAD_BYTES) {
					setError(
						`Plik „${file.name}” jest za duży (maks. ${MAX_CMS_UPLOAD_MB} MB). Zapisz jako JPG/WebP.`,
					);
					return;
				}
			}

			setUploading(true);
			setError(null);
			try {
				const formData = new FormData();
				for (const file of toUpload) formData.append("files", file);

				const res = await fetch("/api/magazyn/cms-upload", {
					method: "POST",
					body: formData,
					credentials: "same-origin",
				});

				const payload = await readUploadResponse(res);

				if (!payload.ok) {
					setError(payload.error ?? "Upload nie powiódł się. Spróbuj ponownie.");
					return;
				}

				const urls = payload.urls;
				if (urls.length === 0) return;

				if (batchMode) {
					onMultipleChange(urls);
				} else {
					const url = urls[0];
					if (url) onChange(url);
				}
			} catch {
				setError("Upload nie powiódł się. Sprawdź połączenie i spróbuj ponownie.");
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
							unoptimized={isCmsImageUnoptimized(previewUrl)}
						/>
						<button
							type="button"
							aria-label="Usuń obraz"
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
						"grid cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted",
						batchMode ? "h-20 min-w-[10rem] flex-1 px-4" : "h-24 w-40",
						isDragging && "border-primary bg-primary/5",
						uploading && "pointer-events-none opacity-60",
					)}
				>
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
				<input
					id={fileId}
					type="file"
					accept="image/*"
					multiple={batchMode}
					className="sr-only"
					disabled={uploading}
					onChange={(e) => {
						void uploadFiles(Array.from(e.target.files ?? []));
						e.target.value = "";
					}}
				/>
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
			<p className="text-xs text-muted-foreground">
				{description ??
					(batchMode
						? "Zdjęcia zapisują się automatycznie w CMS. Na stronie sklepu pojawią się po Redeploy (~2–3 min)."
						: "Przeciągnij zdjęcie na pole lub wybierz plik. Zapisz formularz, potem Redeploy u góry panelu (~2–3 min na prod).")}
			</p>
		</div>
	);
}
