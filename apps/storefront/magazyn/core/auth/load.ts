import "server-only";
import { redirect } from "next/navigation";
import { magazynConfig } from "../../magazyn.config";
import { AdminUnauthorizedError } from "../medusa/errors";

/**
 * Wrapper do pobierania danych w Server Components.
 * Wygasła sesja → przekierowanie na ekran logowania (czyszczenie cookie po stronie route'u).
 */
export async function loadAdmin<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) {
			redirect(`${magazynConfig.basePath}/login`);
		}
		throw error;
	}
}
