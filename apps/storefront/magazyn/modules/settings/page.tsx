import { redirect } from "next/navigation";
import { magazynConfig } from "@magazyn/magazyn.config";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
	redirect(`${magazynConfig.basePath}/panel/ustawienia/kolory`);
}
