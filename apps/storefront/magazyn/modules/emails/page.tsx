import { loadAdmin } from "@magazyn/core/auth/load";
import { magazynConfig } from "@magazyn/magazyn.config";
import { getAllEmailTemplates } from "./store";
import { EmailsList } from "./emails-list";

/**
 * Lista szablonów maili. Skopiuj/re-eksportuj w `app{basePath}/(panel)/maile/page.tsx`:
 *
 *   export { default, dynamic } from "@magazyn/modules/emails/page";
 */
export const dynamic = "force-dynamic";

export default async function MailePage() {
	const templates = await loadAdmin(getAllEmailTemplates);
	const basePath = magazynConfig.basePath;

	return <EmailsList templates={templates} basePath={basePath} />;
}
