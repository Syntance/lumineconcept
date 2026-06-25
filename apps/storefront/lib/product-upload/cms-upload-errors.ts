export function isNetworkFetchError(error: unknown): boolean {
	return error instanceof TypeError && error.message === "Failed to fetch";
}

/** Next.js Server Actions zwracają ten komunikat przy 413 / HTML zamiast JSON. */
export function isServerActionTransportError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	return /unexpected response was received from the server/i.test(error.message);
}
