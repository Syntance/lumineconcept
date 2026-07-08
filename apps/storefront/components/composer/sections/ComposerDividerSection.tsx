type Props = {
	style?: "line" | "space";
};

export function ComposerDividerSection({ style = "line" }: Props) {
	if (style === "space") {
		return <div className="h-12 md:h-16" aria-hidden="true" />;
	}
	return <hr className="mx-auto w-full max-w-5xl border-border" />;
}
