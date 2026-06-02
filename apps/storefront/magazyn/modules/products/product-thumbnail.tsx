"use client";

import Image from "next/image";

/** Miniatura z bezpiecznym fallbackiem gdy obraz nie zdoła się załadować. */
export function ProductThumbnail({ url }: { url: string }) {
	return <Image src={url} alt="" fill sizes="44px" className="object-cover" />;
}
