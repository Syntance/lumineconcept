import type { ComponentType } from "react";
import {
	Archive,
	File,
	FileCode,
	FileSpreadsheet,
	FileText,
	FileType as FileTypeLucideIcon,
	Image,
	Music2,
	PenTool,
	Presentation,
	Spline,
	Type,
	Video,
	type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type FileType, resolveFileType } from "@/lib/files/file-type";

const ICON_STROKE = 1.75;

const ICONS: Record<FileType, ComponentType<LucideProps>> = {
	pdf: FileTypeLucideIcon,
	image: Image,
	vector: Spline,
	document: FileText,
	spreadsheet: FileSpreadsheet,
	presentation: Presentation,
	archive: Archive,
	video: Video,
	audio: Music2,
	design: PenTool,
	font: Type,
	code: FileCode,
	unknown: File,
};

const SHELL_SIZE = {
	xs: "size-5",
	sm: "size-6",
	md: "size-8",
} as const;

const GLYPH_SIZE = {
	xs: "size-3",
	sm: "size-3.5",
	md: "size-4",
} as const;

type Props = {
	type?: FileType;
	filename?: string;
	extension?: string;
	size?: keyof typeof SHELL_SIZE;
	className?: string;
};

/** Ikona typu pliku — okrągłe tło + line-art jak ikona palety w panelu. */
export function FileTypeIcon({
	type,
	filename,
	extension,
	size = "sm",
	className,
}: Props) {
	const resolvedType =
		type ??
		(extension ? resolveFileType(extension) : filename ? resolveFileType(filename) : "unknown");
	const Icon = ICONS[resolvedType];

	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center rounded-full bg-muted text-foreground",
				SHELL_SIZE[size],
				className,
			)}
			aria-hidden
		>
			<Icon className={GLYPH_SIZE[size]} strokeWidth={ICON_STROKE} aria-hidden />
		</span>
	);
}
