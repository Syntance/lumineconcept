"use client";

import { useActionState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { googleStartAction, type LoginState, loginEmailAction } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm({ googleEnabled, googleError }: { googleEnabled: boolean; googleError: boolean }) {
	const [state, formAction, pending] = useActionState(loginEmailAction, initialState);
	const [googleState, googleFormAction, googlePending] = useActionState(async () => googleStartAction(), initialState);

	const errorMessage =
		state.error ?? googleState.error ?? (googleError ? "Logowanie Google nie powiodło się." : null);

	return (
		<div className="flex flex-col gap-6">
			<form action={formAction} className="flex flex-col gap-4">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="email" className="text-sm font-medium">Email</label>
					<Input id="email" name="email" type="email" autoComplete="email" required placeholder="admin@twojadomena.pl" className="h-10" />
				</div>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="password" className="text-sm font-medium">Hasło</label>
					<Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" className="h-10" />
				</div>

				{errorMessage ? (
					<p role="alert" aria-live="assertive" className="text-sm text-destructive">{errorMessage}</p>
				) : null}

				<Button type="submit" size="lg" disabled={pending} className="h-10 w-full">
					{pending ? "Logowanie…" : "Zaloguj się"}
				</Button>
			</form>

			{googleEnabled ? (
				<>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span className="h-px flex-1 bg-border" />
						lub
						<span className="h-px flex-1 bg-border" />
					</div>
					<form action={googleFormAction}>
						<Button type="submit" variant="outline" size="lg" disabled={googlePending} className="h-10 w-full">
							{googlePending ? "Przekierowanie…" : "Kontynuuj z Google"}
						</Button>
					</form>
				</>
			) : null}
		</div>
	);
}
