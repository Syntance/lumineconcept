import { LogOut } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "../auth/actions";
import { Button } from "../ui/button";

export function SidebarFooter({ storefrontUrl }: { storefrontUrl: string }) {
	return (
		<div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
			<Link
				href={storefrontUrl}
				className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
			>
				<span aria-hidden className="text-base leading-none">
					↗
				</span>
				Otwórz sklep
			</Link>
			<form action={logoutAction}>
				<Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2.5 px-3">
					<LogOut className="size-4" aria-hidden />
					Wyloguj
				</Button>
			</form>
		</div>
	);
}
