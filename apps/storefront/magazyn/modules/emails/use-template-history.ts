import { useCallback, useRef, useState } from "react";
import type { EmailTemplate, EmailTemplateType } from "./template-types";

const MAX_HISTORY = 40;
/** Edycja tekstu w inspektorze — jeden wpis historii na serię zmian. */
const COALESCE_MS = 900;

function cloneTemplate(template: EmailTemplate): EmailTemplate {
	return structuredClone(template);
}

export function useTemplateHistory() {
	const pastRef = useRef<Partial<Record<EmailTemplateType, EmailTemplate[]>>>({});
	const coalesceRef = useRef<Partial<Record<EmailTemplateType, number>>>({});
	const [version, setVersion] = useState(0);

	const bump = useCallback(() => setVersion((v) => v + 1), []);

	const recordBeforeChange = useCallback(
		(type: EmailTemplateType, current: EmailTemplate) => {
			const now = Date.now();
			const lastAt = coalesceRef.current[type] ?? 0;
			if (now - lastAt < COALESCE_MS) return;

			coalesceRef.current[type] = now;
			const stack = pastRef.current[type] ?? [];
			stack.push(cloneTemplate(current));
			if (stack.length > MAX_HISTORY) stack.shift();
			pastRef.current[type] = stack;
			bump();
		},
		[bump],
	);

	const canUndo = useCallback(
		(type: EmailTemplateType) => {
			void version;
			return (pastRef.current[type]?.length ?? 0) > 0;
		},
		[version],
	);

	const undo = useCallback(
		(type: EmailTemplateType): EmailTemplate | null => {
			const stack = pastRef.current[type];
			if (!stack?.length) return null;
			const previous = stack.pop()!;
			pastRef.current[type] = stack;
			coalesceRef.current[type] = 0;
			bump();
			return previous;
		},
		[bump],
	);

	const clear = useCallback(
		(type: EmailTemplateType) => {
			delete pastRef.current[type];
			delete coalesceRef.current[type];
			bump();
		},
		[bump],
	);

	return { recordBeforeChange, canUndo, undo, clear };
}
