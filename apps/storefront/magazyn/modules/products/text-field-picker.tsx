"use client";

import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@magazyn/core/lib/cn";
import { MAX_TEXT_FIELDS } from "@/lib/products/text-fields";
import type { TextFieldDef } from "@/lib/products/text-fields";

type Props = {
	fields: TextFieldDef[];
	activeFieldKey: string;
	onActiveFieldChange: (key: string) => void;
	onAddField: () => void;
	onRemoveField: (fieldKey: string) => void;
	onRenameField?: (fieldKey: string, newLabel: string) => void;
};

export function TextFieldPicker({
	fields,
	activeFieldKey,
	onActiveFieldChange,
	onAddField,
	onRemoveField,
	onRenameField,
}: Props) {
	const triggerId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const editInputRef = useRef<HTMLInputElement>(null);
	const prevFieldCountRef = useRef(fields.length);

	const canAddField = fields.length < MAX_TEXT_FIELDS;
	const activeField = fields.find((f) => f.key === activeFieldKey);

	useEffect(() => {
		if (fields.length > prevFieldCountRef.current) {
			const newField = fields[fields.length - 1];
			if (newField && onRenameField) {
				setEditingKey(newField.key);
				setEditValue(newField.label);
				setTimeout(() => editInputRef.current?.select(), 50);
			}
		}
		prevFieldCountRef.current = fields.length;
	}, [fields, onRenameField]);

	useEffect(() => {
		if (!menuOpen) return;
		function onPointerDown(event: MouseEvent) {
			if (!rootRef.current?.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		}
		function onEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				if (editingKey) cancelEditing();
				else setMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onEscape);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onEscape);
		};
	}, [menuOpen, editingKey]);

	function selectField(key: string) {
		if (editingKey) return;
		onActiveFieldChange(key);
		setMenuOpen(false);
	}

	function handleRemoveField(key: string, e: React.MouseEvent) {
		e.stopPropagation();
		onRemoveField(key);
	}

	function startEditing(field: TextFieldDef, e: React.MouseEvent) {
		e.stopPropagation();
		if (!onRenameField) return;
		setEditingKey(field.key);
		setEditValue(field.label);
		setTimeout(() => editInputRef.current?.focus(), 0);
	}

	function finishEditing() {
		if (!editingKey || !onRenameField) return;
		const trimmed = editValue.trim();
		if (trimmed) onRenameField(editingKey, trimmed);
		setEditingKey(null);
		setEditValue("");
	}

	function cancelEditing() {
		setEditingKey(null);
		setEditValue("");
	}

	return (
		<div ref={rootRef} className="flex flex-col gap-1.5">
			<label id={triggerId} className="text-sm font-medium text-foreground">
				Pole tekstowe
			</label>

			<div className="relative max-w-xs">
				<button
					type="button"
					aria-haspopup="listbox"
					aria-expanded={menuOpen}
					aria-labelledby={triggerId}
					onClick={() => setMenuOpen((open) => !open)}
					disabled={fields.length === 0}
					className={cn(
						"flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors outline-none",
						"hover:border-primary/35 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
						menuOpen && "border-primary/40 ring-3 ring-ring/30",
						fields.length === 0 && "text-muted-foreground",
					)}
				>
					<span className="truncate">
						{activeField?.label ?? (fields.length === 0 ? "Brak pól — dodaj pierwsze" : "Wybierz pole")}
					</span>
					<ChevronDown
						className={cn(
							"size-4 shrink-0 text-muted-foreground transition-transform duration-200",
							menuOpen && "rotate-180",
						)}
						aria-hidden
					/>
				</button>

				{menuOpen ? (
					<div
						role="listbox"
						aria-labelledby={triggerId}
						className="absolute left-0 z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
					>
						<ul className="max-h-56 overflow-y-auto">
							{fields.map((field) => {
								const active = field.key === activeFieldKey;
								const isEditing = editingKey === field.key;

								return (
									<li
										key={field.key}
										role="presentation"
										className={cn(
											"group flex items-center gap-1 transition-colors",
											!isEditing && (active ? "bg-primary/12" : "hover:bg-muted"),
										)}
									>
										{isEditing ? (
											<div className="flex flex-1 items-center gap-1.5 px-3 py-2">
												<input
													ref={editInputRef}
													type="text"
													value={editValue}
													onChange={(e) => setEditValue(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter") finishEditing();
														if (e.key === "Escape") cancelEditing();
													}}
													onBlur={finishEditing}
													className="h-7 flex-1 rounded border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
													placeholder="Tytuł pola"
												/>
											</div>
										) : (
											<>
												<button
													type="button"
													role="option"
													aria-selected={active}
													onClick={() => selectField(field.key)}
													className={cn(
														"min-w-0 flex-1 truncate px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:bg-muted",
														active
															? "font-medium text-foreground"
															: "text-muted-foreground group-hover:text-foreground",
													)}
												>
													{field.label}
												</button>
												<div className="flex shrink-0 items-center gap-1 pr-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
													{onRenameField ? (
														<button
															type="button"
															onClick={(e) => startEditing(field, e)}
															className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground"
															aria-label={`Zmień nazwę: ${field.label}`}
														>
															<Pencil className="size-3.5" aria-hidden />
														</button>
													) : null}
													<button
														type="button"
														onClick={(e) => handleRemoveField(field.key, e)}
														className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
														aria-label={`Usuń pole: ${field.label}`}
													>
														<Trash2 className="size-3.5" aria-hidden />
													</button>
												</div>
											</>
										)}
									</li>
								);
							})}
						</ul>

						{canAddField ? (
							<div className="border-t border-border/80 p-1">
								<button
									type="button"
									onClick={onAddField}
									className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted"
								>
									<Plus className="size-3.5 shrink-0 text-primary" aria-hidden />
									Dodaj pole tekstowe
								</button>
							</div>
						) : null}
					</div>
				) : null}
			</div>

			{fields.length === 0 && canAddField ? (
				<button
					type="button"
					onClick={onAddField}
					className="inline-flex h-9 w-fit items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
				>
					<Plus className="size-3.5 shrink-0 text-primary" aria-hidden />
					Dodaj pole tekstowe
				</button>
			) : null}

			{activeField ? (
				<p className="text-xs text-muted-foreground">
					Ustawienia poniżej dotyczą pola „{activeField.label}”. Klient wypełni je w konfiguratorze sklepu.
				</p>
			) : null}
		</div>
	);
}
