import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="bg-brand-900 text-brand-100 text-center text-xs py-2 px-4">
      <p>
        Darmowa dostawa od 250 zł ·{" "}
        <Link href="/produkty" className="underline hover:text-white transition-colors">
          Zobacz produkty
        </Link>
      </p>
    </div>
  );
}
