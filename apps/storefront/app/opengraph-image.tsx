import { ImageResponse } from "next/og";

/**
 * Domyślny (dynamicznie generowany) obraz OG dla stron BEZ własnego obrazka.
 *
 * Strony z obrazem OG z CMS (root layout, `buildMetadata`) nadpisują ten plik
 * przez `metadata.openGraph.images` — to fallback m.in. dla stron prawnych/
 * informacyjnych, które wcześniej nie miały żadnego OG.
 */
export const alt = "Lumine Concept — Plexi & Branding dla Salonów Beauty";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
	return new ImageResponse(
		(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					background: "#725750",
					color: "#EEE8E0",
					padding: "0 80px",
					textAlign: "center",
				}}
			>
				<div
					style={{
						display: "flex",
						fontSize: 30,
						letterSpacing: "0.3em",
						textTransform: "uppercase",
						opacity: 0.85,
						marginBottom: 28,
					}}
				>
					Lumine Concept
				</div>
				<div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.15 }}>
					Plexi &amp; Branding dla Salonów Beauty
				</div>
			</div>
		),
		{ ...size },
	);
}
