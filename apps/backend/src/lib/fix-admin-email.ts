import { Modules } from "@medusajs/framework/utils";

export const ADMIN_EMAIL_FIX = {
	oldEmail: "lumie.strona@gmail.com",
	newEmail: "lumine.strona@gmail.com",
	userId: "user_01KT3RFCSW3J0AKKE2V9EQHEYA",
} as const;

type Logger = {
	info: (msg: string) => void;
	warn: (msg: string) => void;
	error: (msg: string) => void;
};

type AuthModuleLike = {
	listProviderIdentities: (
		filters?: { entity_id?: string; provider?: string },
		config?: { take?: number },
	) => Promise<
		Array<{
			id: string;
			provider: string;
			entity_id: string;
			auth_identity_id?: string;
		}>
	>;
	updateProviderIdentities: (
		data:
			| { id: string; entity_id: string }
			| Array<{ id: string; entity_id: string }>,
	) => Promise<unknown>;
};

type UserModuleLike = {
	retrieveUser: (id: string) => Promise<{ id: string; email: string }>;
	updateUsers: (data: { id: string; email: string }) => Promise<unknown>;
};

export async function fixAdminEmail(
	scope: {
		resolve: (key: string) => unknown;
	},
	options?: { dryRun?: boolean },
): Promise<{
	ok: boolean;
	message: string;
	updatedProviderId?: string;
}> {
	const logger = scope.resolve("logger") as Logger;
	const authModule = scope.resolve(Modules.AUTH) as AuthModuleLike;
	const userModule = scope.resolve(Modules.USER) as UserModuleLike;
	const dryRun = options?.dryRun ?? false;

	const user = await userModule.retrieveUser(ADMIN_EMAIL_FIX.userId);
	if (user.email === ADMIN_EMAIL_FIX.newEmail) {
		return { ok: true, message: "Email admina jest już poprawny." };
	}
	if (user.email !== ADMIN_EMAIL_FIX.oldEmail) {
		throw new Error(
			`Nieoczekiwany email użytkownika ${user.id}: "${user.email}" (oczekiwano "${ADMIN_EMAIL_FIX.oldEmail}").`,
		);
	}

	const [oldProviders, newProviders] = await Promise.all([
		authModule.listProviderIdentities(
			{ entity_id: ADMIN_EMAIL_FIX.oldEmail, provider: "emailpass" },
			{ take: 10 },
		),
		authModule.listProviderIdentities(
			{ entity_id: ADMIN_EMAIL_FIX.newEmail, provider: "emailpass" },
			{ take: 10 },
		),
	]);

	// Auth już zmigrowany (np. po częściowym uruchomieniu) — zostaje tylko rekord user.
	if (oldProviders.length === 0 && newProviders.length > 0) {
		logger.info(
			`[fix-admin-email] ${dryRun ? "DRY RUN" : "UPDATE"} user.email only (auth już na ${ADMIN_EMAIL_FIX.newEmail})`,
		);
		if (!dryRun) {
			await userModule.updateUsers({
				id: user.id,
				email: ADMIN_EMAIL_FIX.newEmail,
			});
		}
		return {
			ok: true,
			message: `Email admina ${dryRun ? "do ustawienia" : "ustawiony"} na ${ADMIN_EMAIL_FIX.newEmail}.`,
		};
	}

	if (newProviders.length > 0 && !dryRun) {
		for (const conflict of newProviders) {
			const archivedEntity = `archived-${conflict.id.slice(-8)}@lumineconcept.internal`;
			logger.warn(
				`[fix-admin-email] Archiwizuję konfliktową tożsamość ${conflict.id} → ${archivedEntity}`,
			);
			await authModule.updateProviderIdentities({
				id: conflict.id,
				entity_id: archivedEntity,
			});
		}
	} else if (newProviders.length > 0 && dryRun) {
		logger.warn(
			`[fix-admin-email] DRY RUN: znaleziono ${newProviders.length} konfliktowych tożsamości dla ${ADMIN_EMAIL_FIX.newEmail}`,
		);
	}

	const provider = oldProviders[0];
	if (!provider) {
		throw new Error(
			`Brak provider identity emailpass dla "${ADMIN_EMAIL_FIX.oldEmail}".`,
		);
	}

	logger.info(
		`[fix-admin-email] ${dryRun ? "DRY RUN" : "UPDATE"} user=${user.id} provider=${provider.id}`,
	);

	if (dryRun) {
		return {
			ok: true,
			message: "Dry run — brak zapisu.",
			updatedProviderId: provider.id,
		};
	}

	await authModule.updateProviderIdentities({
		id: provider.id,
		entity_id: ADMIN_EMAIL_FIX.newEmail,
	});

	await userModule.updateUsers({
		id: user.id,
		email: ADMIN_EMAIL_FIX.newEmail,
	});

	return {
		ok: true,
		message: `Email admina zmieniony na ${ADMIN_EMAIL_FIX.newEmail}.`,
		updatedProviderId: provider.id,
	};
}
