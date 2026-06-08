import Link from "next/link";

const SHOP_CTA_CLASS =
  "inline-flex w-full max-w-[17.5rem] items-center justify-center whitespace-nowrap rounded-none border-0 bg-white px-6 py-3.5 font-gilroy text-[11px] font-semibold uppercase tracking-[0.2em] text-black shadow-none outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

/**
 * Hero na mobile i wąskich ekranach (< lg):
 * treść wyśrodkowana pionowo i poziomo, pełna szerokość CTA — bez portalu SVG.
 */
export function HeroPortalMobile() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative z-10 w-full px-5 text-center sm:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <h1 className="m-0 font-binerka text-[2.35rem] leading-none tracking-[0.06em] text-white sm:text-[2.65rem]">
            CONCEPT
          </h1>

          <div className="flex flex-col items-center gap-2">
            <p className="m-0 font-gilroy text-[13px] font-medium uppercase leading-snug tracking-[0.08em] text-white sm:text-sm">
              Wyróżnij swój salon
            </p>

            <p className="m-0 max-w-[18rem] font-gilroy text-xs font-light leading-snug tracking-[0.04em] text-white/90 sm:max-w-xs sm:text-[13px]">
              Tablice z logo, cenniki i oznaczenia z plexi
            </p>
          </div>

          <Link href="/sklep" className={`${SHOP_CTA_CLASS} mt-1`}>
            Zobacz produkty
          </Link>
        </div>
      </div>
    </div>
  );
}
