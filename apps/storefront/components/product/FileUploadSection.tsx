"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, FileText, ExternalLink } from "lucide-react";

export interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

const MAX_FILES = 5;

function isImageFilename(name: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(name);
}

interface FileUploadSectionProps {
  maxFiles?: number;
  label?: string;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export function FileUploadSection({
  maxFiles = MAX_FILES,
  label,
  files,
  onFilesChange,
}: FileUploadSectionProps) {
  const cap = Math.min(Math.max(maxFiles, 1), MAX_FILES);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadOne = useCallback(
    async (file: File): Promise<UploadedFile | null> => {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Błąd uploadu");
        return null;
      }

      return { url: data.url, filename: data.filename, size: data.size };
    },
    [],
  );

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      e.target.value = "";

      if (selected.length === 0) return;

      const remaining = cap - files.length;
      if (remaining <= 0) {
        setError(`Możesz dodać maksymalnie ${cap} plików.`);
        return;
      }

      setError(null);
      const toProcess = selected.slice(0, remaining);
      if (selected.length > remaining) {
        setError(`Dodano tylko pierwsze ${remaining} plików (limit ${cap}).`);
      }

      setUploading(true);
      const next = [...files];

      try {
        for (const file of toProcess) {
          const uploaded = await uploadOne(file);
          if (uploaded) next.push(uploaded);
        }
        onFilesChange(next);
      } finally {
        setUploading(false);
      }
    },
    [cap, files, onFilesChange, uploadOne],
  );

  const handleRemove = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
      setError(null);
    },
    [files, onFilesChange],
  );

  const atLimit = files.length >= cap;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-700">
        {label || "Wgraj swoje logo lub elementy"}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.ai,.svg,.eps"
          className="sr-only"
          id="file-upload-multi"
          disabled={uploading || atLimit}
          onChange={handleInputChange}
        />
        <label
          htmlFor="file-upload-multi"
          className={`flex cursor-pointer items-center justify-center border border-brand-300 bg-white px-6 py-2 text-[11px] font-medium uppercase tracking-wider text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50 ${
            uploading || atLimit ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploading ? "Przesyłanie…" : atLimit ? "Limit plików" : "Wybierz pliki"}
        </label>
        <span className="text-xs text-brand-500">
          {files.length}/{cap}
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2 border border-brand-200 bg-white p-3">
          {files.map((file, index) => (
            <li
              key={`${file.url}-${index}`}
              className="flex items-center gap-3 border-b border-brand-100 pb-2 last:border-0 last:pb-0"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-brand-200 bg-brand-50">
                {isImageFilename(file.filename) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileText className="h-7 w-7 text-brand-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-brand-800" title={file.filename}>
                  {file.filename}
                </p>
                <p className="text-[10px] text-brand-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 underline-offset-2 hover:text-brand-800 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Podgląd
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded p-1 text-brand-400 transition-colors hover:bg-brand-100 hover:text-red-600"
                  aria-label={`Usuń ${file.filename}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
