"use client";

import { useCallback, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MiniConfiguratorModal } from "./MiniConfiguratorModal";

interface AddToCartButtonProps {
  variantId: string;
  productId: string;
  title: string;
  price: number;
  thumbnail?: string | null;
  options?: Record<string, string[]>;
  linksCount?: number;
  href?: string;
  children: ReactNode;
}

export function AddToCartButton({
  variantId,
  productId,
  title,
  price,
  thumbnail,
  options,
  linksCount,
  href,
  children,
}: AddToCartButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setModalOpen(true);
    },
    [],
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="relative shrink-0 flex w-full items-center justify-center rounded-md border border-[#EEE8E0] bg-white py-2 px-3 transition-all duration-200 group-hover:bg-[#EEE8E0]"
      >
        <span className="transition-opacity duration-200 group-hover:opacity-0">
          {children}
        </span>
        <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-xs font-semibold uppercase tracking-[0.15em] text-brand-800 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Dodaj do koszyka
        </span>
      </button>
      {modalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <MiniConfiguratorModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            productId={productId}
            variantId={variantId}
            title={title}
            price={price}
            thumbnail={thumbnail ?? null}
            options={options ?? {}}
            linksCount={linksCount ?? 0}
            href={href}
          />,
          document.body,
        )}
    </>
  );
}
