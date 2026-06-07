"use client";

import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@magazyn/core/lib/cn";
import { formatColorSlotLabel, MAX_COLOR_SLOTS, MIN_COLOR_SLOTS } from "@/lib/products/color-slot-config";

type Props = {
	slotTitles: string[];
	activeSlot: string;
	onActiveSlotChange: (slot: string) => void;
	onAddSlot: () => void;
	onRemoveSlot: (slotTitle: string) => void;
	onRenameSlot?: (oldTitle: string, newTitle: string) => void;
};

export function ColorSlotPicker({
	slotTitles,
	activeSlot,
	onActiveSlotChange,
	onAddSlot,
	onRemoveSlot,
	onRenameSlot,
}: Props) {
	const triggerId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [editingSlot, setEditingSlot] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const editInputRef = useRef<HTMLInputElement>(null);
	const prevSlotCountRef = useRef(slotTitles.length);

	const canAddSlot = slotTitles.length < MAX_COLOR_SLOTS;
	const canRemoveSlot = slotTitles.length > MIN_COLOR_SLOTS;

	// Auto-włącz edycję dla nowo dodanego pola
	useEffect(() => {
		if (slotTitles.length > prevSlotCountRef.current) {
			const newSlot = slotTitles[slotTitles.length - 1];
			if (newSlot && onRenameSlot) {
				setEditingSlot(newSlot);
				setEditValue(newSlot);
				setTimeout(() => editInputRef.current?.select(), 50);
			}
		}
		prevSlotCountRef.current = slotTitles.length;
	}, [slotTitles, onRenameSlot]);

	useEffect(() => {
		if (!menuOpen) return;
		function onPointerDown(event: MouseEvent) {
			if (!rootRef.current?.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		}
		function onEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				if (editingSlot) {
					cancelEditing();
				} else {
					setMenuOpen(false);
				}
			}
		}
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onEscape);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onEscape);
		};
	}, [menuOpen, editingSlot]);

	function selectSlot(title: string) {
		if (editingSlot) return;
		onActiveSlotChange(title);
		setMenuOpen(false);
	}

	function handleAddSlot() {
		onAddSlot();
		// Nie zamykamy menu, żeby użytkownik od razu zobaczył nowe pole w trybie edycji
	}

	function handleRemoveSlot(title: string, e: React.MouseEvent) {
		e.stopPropagation();
		if (!canRemoveSlot) return;
		onRemoveSlot(title);
	}

	function startEditing(title: string, e: React.MouseEvent) {
		e.stopPropagation();
		if (!onRenameSlot) return;
		setEditingSlot(title);
		setEditValue(title);
		setTimeout(() => editInputRef.current?.focus(), 0);
	}

	function finishEditing() {
		if (!editingSlot || !onRenameSlot) return;
		const trimmed = editValue.trim();
		if (trimmed && trimmed !== editingSlot && !slotTitles.includes(trimmed)) {
			onRenameSlot(editingSlot, trimmed);
		}
		setEditingSlot(null);
		setEditValue("");
	}

	function cancelEditing() {
		setEditingSlot(null);
		setEditValue("");
	}

	return (
		<div ref={rootRef} className="flex flex-col gap-1.5">
			<label id={triggerId} className="text-sm font-medium text-foreground">
				Pole koloru
			</label>

			<div className="relative max-w-xs">
				<button
					type="button"
					aria-haspopup="listbox"
					aria-expanded={menuOpen}
					aria-labelledby={triggerId}
					onClick={() => setMenuOpen((open) => !open)}
					className={cn(
						"flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors outline-none",
						"hover:border-primary/35 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
						menuOpen && "border-primary/40 ring-3 ring-ring/30",
					)}
				>
					<span className="truncate">{formatColorSlotLabel(activeSlot)}</span>
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
							{slotTitles.map((title) => {
								const active = title === activeSlot;
								const isEditing = editingSlot === title;
								
								return (
									<li
										key={title}
										role="presentation"
										className={cn(
											"group flex items-center gap-1 transition-colors",
											!isEditing &&
												(active
													? "bg-primary/12"
													: "hover:bg-muted"),
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
													placeholder="Nazwa pola"
												/>
											</div>
										) : (
											<>
												<button
													type="button"
													role="option"
													aria-selected={active}
													onClick={() => selectSlot(title)}
													className={cn(
														"min-w-0 flex-1 truncate px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:bg-muted",
														active
															? "font-medium text-foreground"
															: "text-muted-foreground group-hover:text-foreground",
													)}
												>
													{formatColorSlotLabel(title)}
												</button>
												<div className="flex shrink-0 items-center gap-1 pr-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
													{onRenameSlot ? (
														<button
															type="button"
															onClick={(e) => startEditing(title, e)}
															className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground"
															aria-label={`Zmień nazwę: ${formatColorSlotLabel(title)}`}
														>
															<Pencil className="size-3.5" aria-hidden />
														</button>
													) : null}
													{canRemoveSlot ? (
														<button
															type="button"
															onClick={(e) => handleRemoveSlot(title, e)}
															className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
															aria-label={`Usuń pole: ${formatColorSlotLabel(title)}`}
														>
															<Trash2 className="size-3.5" aria-hidden />
														</button>
													) : null}
												</div>
											</>
										)}
									</li>
								);
							})}
						</ul>

						{canAddSlot ? (
							<div className="border-t border-border/80 p-1">
								<button
									type="button"
									onClick={handleAddSlot}
									className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted"
								>
									<Plus className="size-3.5 shrink-0 text-primary" aria-hidden />
									Dodaj pole koloru
								</button>
							</div>
						) : null}
					</div>
				) : null}
			</div>

			<p className="text-xs text-muted-foreground">
				Kolory poniżej dotyczą pola „{formatColorSlotLabel(activeSlot)}”. W konfiguratorze sklepu każde pole ma własną listę.
			</p>
		</div>
	);
}
