import {
	createDefaultTextField,
	generateTextFieldKey,
	MAX_TEXT_FIELDS,
	parseTextFieldsFromMetadata,
	type TextFieldDef,
} from "@/lib/products/text-fields";
import type { AdminProductDetail } from "./store";

export type TextFieldFormState = {
	fields: TextFieldDef[];
	activeFieldKey: string;
};

function ensureUniqueKey(base: string, fields: TextFieldDef[], excludeKey?: string): string {
	let key = base || "tekst";
	let counter = 2;
	while (fields.some((f) => f.key === key && f.key !== excludeKey)) {
		key = `${base || "tekst"}_${counter++}`;
	}
	return key;
}

export function createInitialTextFieldState(
	product: AdminProductDetail | undefined,
): TextFieldFormState {
	const fields = parseTextFieldsFromMetadata(product?.metadata);
	return {
		fields,
		activeFieldKey: fields[0]?.key ?? "",
	};
}

export function addTextField(state: TextFieldFormState): TextFieldFormState {
	if (state.fields.length >= MAX_TEXT_FIELDS) return state;

	const draft = createDefaultTextField(state.fields.length);
	const key = ensureUniqueKey(draft.key, state.fields);
	const field: TextFieldDef = { ...draft, key };

	return {
		fields: [...state.fields, field],
		activeFieldKey: key,
	};
}

export function removeTextField(state: TextFieldFormState, keyToRemove?: string): TextFieldFormState {
	const removeKey = keyToRemove ?? state.activeFieldKey;
	if (!removeKey) return state;

	const fields = state.fields.filter((f) => f.key !== removeKey);
	const removeIndex = state.fields.findIndex((f) => f.key === removeKey);
	const nextActive =
		removeKey === state.activeFieldKey
			? (fields[Math.min(Math.max(removeIndex, 0), fields.length - 1)]?.key ?? "")
			: state.activeFieldKey;

	return {
		fields,
		activeFieldKey: nextActive,
	};
}

export function renameTextFieldLabel(
	state: TextFieldFormState,
	fieldKey: string,
	newLabel: string,
): TextFieldFormState {
	const trimmed = newLabel.trim();
	if (!trimmed) return state;

	let activeFieldKey = state.activeFieldKey;
	const fields = state.fields.map((field) => {
		if (field.key !== fieldKey) return field;
		const autoKey = generateTextFieldKey(trimmed);
		const shouldAutoKey = field.key === generateTextFieldKey(field.label);
		const nextKey = shouldAutoKey
			? ensureUniqueKey(autoKey || "tekst", state.fields, field.key)
			: field.key;
		if (state.activeFieldKey === fieldKey) activeFieldKey = nextKey;
		return { ...field, label: trimmed, key: nextKey };
	});

	return { fields, activeFieldKey };
}

export function updateTextField(
	state: TextFieldFormState,
	fieldKey: string,
	patch: Partial<TextFieldDef>,
): TextFieldFormState {
	let activeFieldKey = state.activeFieldKey;
	const fields = state.fields.map((field) => {
		if (field.key !== fieldKey) return field;
		const nextKey =
			patch.key && patch.key !== field.key
				? ensureUniqueKey(patch.key, state.fields, field.key)
				: field.key;
		if (state.activeFieldKey === fieldKey && nextKey !== fieldKey) {
			activeFieldKey = nextKey;
		}
		return { ...field, ...patch, key: nextKey };
	});

	return { fields, activeFieldKey };
}

export function serializeTextFieldState(state: TextFieldFormState): TextFieldDef[] {
	return state.fields;
}
