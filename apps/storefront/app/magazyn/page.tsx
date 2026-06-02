import { redirect } from "next/navigation";
import { magazynConfig } from "@magazyn/magazyn.config";
import { getSessionToken } from "@magazyn/core/medusa/session";
import { LoginForm } from "@magazyn/core/auth/login-form";

/**
 * Strona logowania - główny entry point /magazyn
 * Po zalogowaniu przekierowuje na /magazyn/panel
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
	const token = await getSessionToken();
	if (token) redirect(`${magazynConfig.basePath}/panel`);

	const { error } = await searchParams;
	const { branding } = magazynConfig;

	return (
		<main className="flex min-h-screen items-center justify-center px-4 py-12">
			<div className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<p className="text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">{branding.name}</p>
					<h1 className="mt-2 font-serif text-2xl text-foreground">Panel {branding.panelTitle}</h1>
					<p className="mt-1 text-sm text-muted-foreground">Zaloguj się, aby zarządzać sklepem.</p>
				</div>

				<div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
					<LoginForm googleEnabled={magazynConfig.auth.google} googleError={error === "google"} />
				</div>
			</div>
		</main>
	);
}
