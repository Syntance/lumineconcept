import type { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

const ADMIN_EMAIL = "lumine.strona@gmail.com";

/** CLI: `medusa exec ./src/scripts/rotate-admin-password.ts` */
export default async function run({ container }: ExecArgs) {
	const logger = container.resolve("logger") as {
		info: (m: string) => void;
		error: (m: string) => void;
	};

	const newPassword = process.env.ROTATE_ADMIN_PASSWORD?.trim();
	if (!newPassword) {
		logger.error("[rotate-admin-password] brak ROTATE_ADMIN_PASSWORD w env");
		process.exitCode = 1;
		return;
	}

	const authModule = container.resolve(Modules.AUTH) as {
		updateProvider: (
			provider: string,
			data: { entity_id: string; password: string },
		) => Promise<{ success: boolean; error?: string }>;
	};

	const result = await authModule.updateProvider("emailpass", {
		entity_id: ADMIN_EMAIL,
		password: newPassword,
	});

	if (!result.success) {
		logger.error(
			`[rotate-admin-password] błąd: ${result.error ?? "unknown"}`,
		);
		process.exitCode = 1;
		return;
	}

	logger.info(`[rotate-admin-password] hasło zaktualizowane dla ${ADMIN_EMAIL}`);
}
