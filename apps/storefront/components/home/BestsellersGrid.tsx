import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product/ProductCard";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { PRODUCT_IMAGE_ASPECT_CLASS } from "@/lib/products/product-image-aspect";

type BestsellerProduct = {
	id: string;
	handle: string;
	title: string;
	thumbnail?: string | null;
	images?: Array<{ url: string }> | null;
	variants?: Array<{ calculated_price?: { calculated_amount?: number | null } | null }> | null;
	metadata?: Record<string, unknown> | null;
};

function extractBasePrice(metadata: Record<string, unknown> | undefined | null): number | null {
	const raw = metadata?.base_price;
	if (raw === undefined || raw === null || raw === "") return null;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : null;
}

function extractPrice(product: BestsellerProduct): number {
	const variantPrice = product.variants?.[0]?.calculated_price?.calculated_amount ?? 0;
	if (variantPrice > 0) return variantPrice;
	return extractBasePrice(product.metadata) ?? 0;
}

type BestsellersGridProps = {
	title: string;
	products: BestsellerProduct[];
	/** Priorytet LCP na stronie głównej / sklepie. */
	priorityImages?: boolean;
};

export function BestsellersGrid({ title, products, priorityImages = false }: BestsellersGridProps) {
	if (products.length === 0) return null;

	return (
		<section>
			<div className="bg-white pt-4 pb-0 md:pt-5">
				<div className="container mx-auto flex justify-center px-4">
					<div className="mx-auto flex w-full max-w-68 justify-center">
						<div className="relative aspect-421/396 w-[42%] min-w-15.75 max-w-30">
							<div
								className="pointer-events-none absolute left-1/2 top-1/2 bottom-0 z-0 w-screen -translate-x-1/2 bg-brand-50"
								aria-hidden
							/>
							<Image
								src="/images/lumine-signet-brown.png"
								alt="Sygnet Lumine Concept"
								fill
								className="relative z-10 object-contain object-center"
								sizes="120px"
								priority={priorityImages}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-brand-50 pt-3 pb-10 md:pt-4 lg:pt-4 lg:pb-10">
				<div className="container mx-auto px-4">
					<div className="mb-10 text-center lg:mb-12">
						<h2 className="font-display text-3xl tracking-widest text-brand-800 lg:text-4xl">
							{title}
						</h2>
						<div className="mx-auto mt-3 h-px w-12 bg-accent" />
					</div>

					<div className="mx-auto grid grid-cols-2 items-start gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6 md:gap-y-8">
						{products.map((product, index) => {
							const frameVariant =
								index === 0 ? "arch-up" : index === 2 ? "arch-down" : "square";
							const sharpCorners = index === 1 || index === 3;
							const price = extractPrice(product);
							const thumbnail =
								product.thumbnail ?? product.images?.[0]?.url ?? null;

							return (
								<Link
									key={product.id}
									href={`/sklep/gotowe-wzory/${product.handle}`}
									className="group flex min-h-0 min-w-0 w-full flex-col items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
								>
									<div className="w-full">
										<ProductCard
											handle={product.handle}
											title={product.title}
											thumbnail={thumbnail}
											price={price}
											frameVariant={frameVariant}
											imageOnly
											linkless
											sharpCorners={sharpCorners}
											hideWatermark
											imageAspectClassName={PRODUCT_IMAGE_ASPECT_CLASS}
											imageAreaClassName="bg-white"
											priority={priorityImages}
											imageSizes="(max-width: 767px) calc(50vw - 24px), calc(25vw - 26px)"
										/>
									</div>
									<p className="line-clamp-2 px-0.5 text-center text-lg font-medium leading-snug text-brand-800">
										{product.title}
									</p>
									<div className="flex w-full justify-center">
										<PriceDisplay amount={price} size="lg" listing />
									</div>
								</Link>
							);
						})}
					</div>

					<div className="mt-10 text-center">
						<Link
							href="/sklep"
							className="text-[14.2px] font-medium uppercase tracking-[0.216em] text-brand-500 transition-colors hover:text-brand-900"
						>
							Zobacz cały sklep &rarr;
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
