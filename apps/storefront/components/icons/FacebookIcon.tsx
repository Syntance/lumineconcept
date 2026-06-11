import { cn } from "@/lib/utils";

const FACEBOOK_MASK = "url('/images/icons/facebook.png')";

/** Logo Facebook — asset od klienta, kolor z `currentColor` (jak Lucide w kapsule kontaktu). */
export function FacebookIcon({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"h-4 w-4 shrink-0 bg-current",
				"[-webkit-mask-image:var(--fb-mask)] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]",
				"[mask-image:var(--fb-mask)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]",
				className,
			)}
			style={{ "--fb-mask": FACEBOOK_MASK } as React.CSSProperties}
			aria-hidden
		/>
	);
}
