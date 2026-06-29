import { Modules } from "@medusajs/framework/utils";
import { setAuthAppMetadataWorkflow } from "@medusajs/medusa/core-flows";

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

type ProviderIdentity = {
	id: string;
	provider: string;
	entity_id: string;
	auth_identity_id?: string;
};

type AuthModuleLike = {
	listProviderIdentities: (
		filters?: { entity_id?: string; provider?: string },
		config?: { take?: number },
	) => Promise<ProviderIdentity[]>;
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
	options?: { dryRun?: boolean; recovery?: boolean },
): Promise<{
	ok: boolean;
	message: string;
	updatedProviderId?: string;
}> {
	const logger = scope.resolve("logger") as Logger;
	const authModule = scope.resolve(Modules.AUTH) as AuthModuleLike;
	const userModule = scope.resolve(Modules.USER) as UserModuleLike;
	const dryRun = options?.dryRun ?? false;
	const recovery = options?.recovery ?? false;

	const user = await userModule.retrieveUser(ADMIN_EMAIL_FIX.userId);
	if (user.email === ADMIN_EMAIL_FIX.newEmail) {
		return { ok: true, message: "Email admina jest już poprawny." };
	}

	const allowedEmails = new Set([
		ADMIN_EMAIL_FIX.oldEmail.toLowerCase(),
		ADMIN_EMAIL_FIX.newEmail.toLowerCase(),
	]);
	if (!allowedEmails.has(user.email.trim().toLowerCase())) {
		throw new Error(
			`Nieoczekiwany email użytkownika ${user.id}: "${user.email}".`,
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

	// Auth już na lumine — dokończ rekord user + ewentualnie powiąż auth z userem.
	if (oldProviders.length === 0 && newProviders.length > 0) {
		const primary = newProviders[0];
		if (!primary?.auth_identity_id) {
			throw new Error("Brak auth_identity_id dla providera lumine.");
		}

		logger.info(
			`[fix-admin-email] ${dryRun ? "DRY RUN" : "UPDATE"} recovery=${recovery} provider=${primary.id}`,
		);

		if (!dryRun) {
			await setAuthAppMetadataWorkflow(scope).run({
				input: {
					authIdentityId: primary.auth_identity_id,
					actorType: "user",
					value: user.id,
				},
			});

			await userModule.updateUsers({
				id: user.id,
				email: ADMIN_EMAIL_FIX.newEmail,
			});

			for (const extra of newProviders.slice(1)) {
				const archivedEntity = `archived-${extra.id.slice(-8)}@lumineconcept.internal`;
				logger.warn(
					`[fix-admin-email] Archiwizuję dodatkową tożsamość ${extra.id}`,
				);
				await authModule.updateProviderIdentities({
					id: extra.id,
					entity_id: archivedEntity,
				});
			}
		}

		return {
			ok: true,
			message: `Email admina ${dryRun ? "do ustawienia" : "ustawiony"} na ${ADMIN_EMAIL_FIX.newEmail}.`,
			updatedProviderId: primary.id,
		};
	}

	// Archiwizuj konflikty lumine tylko przed migracją z lumie (nie w recovery).
	if (!recovery && newProviders.length > 0 && oldProviders.length > 0) {
		if (!dryRun) {
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
		} else {
			logger.warn(
				`[fix-admin-email] DRY RUN: ${newProviders.length} konfliktów dla ${ADMIN_EMAIL_FIX.newEmail}`,
			);
		}
	}

	const provider = oldProviders[0];
	if (!provider) {
		throw new Error(
			`Brak provider identity emailpass dla "${ADMIN_EMAIL_FIX.oldEmail}". Uruchom z recovery=true jeśli auth jest już na ${ADMIN_EMAIL_FIX.newEmail}.`,
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

	if (provider.auth_identity_id) {
		await setAuthAppMetadataWorkflow(scope).run({
			input: {
				authIdentityId: provider.auth_identity_id,
				actorType: "user",
				value: user.id,
			},
		});
	}

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
