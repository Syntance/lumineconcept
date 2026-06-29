import type { ExecArgs } from "@medusajs/framework/types";
import { fixAdminEmail } from "../lib/fix-admin-email";

/**
 * CLI: `pnpm --filter @lumine/backend fix-admin-email`
 *
 * Naprawia literówkę w emailu admina Medusa: lumie.strona → lumine.strona.
 * Flagi (po `--`):
 *   --dry-run   tylko podgląd
 */
export default async function run({ container, args }: ExecArgs) {
	const logger = container.resolve("logger") as {
		info: (msg: string) => void;
		error: (msg: string) => void;
	};

	const dryRun =
		args.includes("--dry-run") ||
		process.env.DRY_RUN === "1" ||
		process.env.DRY_RUN === "true";
	logger.info(`[fix-admin-email] start dryRun=${dryRun}`);

	try {
		const result = await fixAdminEmail(container, { dryRun });
		logger.info(`[fix-admin-email] ${result.message}`);
		if (result.updatedProviderId) {
			logger.info(`[fix-admin-email] provider=${result.updatedProviderId}`);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger.error(`[fix-admin-email] FAILED: ${message}`);
		process.exitCode = 1;
	}
}
