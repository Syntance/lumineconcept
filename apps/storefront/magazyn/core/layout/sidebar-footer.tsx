import { LogOut } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "../auth/actions";
import { Button } from "../ui/button";

export function SidebarFooter({ storefrontUrl }: { storefrontUrl: string }) {
	return (
		<div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
			<Link
				href={storefrontUrl}
				className="px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
			>
				↗ Otwórz sklep
			</Link>
			<form action={logoutAction}>
				<Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
					<LogOut className="size-4" aria-hidden />
					Wyloguj
				</Button>
			</form>
		</div>
	);
}
