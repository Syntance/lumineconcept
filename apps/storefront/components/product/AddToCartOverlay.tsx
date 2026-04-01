"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MiniConfiguratorModal } from "./MiniConfiguratorModal";
import {
  buildColorMap,
  buildColoredSet,
  buildMirrorSet,
  buildMatDisabledSet,
  type GlobalConfigOption,
} from "@/lib/products/global-config";

interface AddToCartButtonProps {
  variantId: string;
  productId: string;
  title: string;
  price: number;
  thumbnail?: string | null;
  options?: Record<string, string[]>;
  linksCount?: number;
  href?: string;
  metadata?: Record<string, unknown>;
  globalColors?: GlobalConfigOption[];
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
  metadata,
  globalColors = [],
  children,
}: AddToCartButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const portalRootRef = useRef<HTMLDivElement | null>(null);

  const colorMap = useMemo(() => buildColorMap(globalColors), [globalColors]);
  const coloredSet = useMemo(() => buildColoredSet(globalColors), [globalColors]);
  const mirrorSet = useMemo(() => buildMirrorSet(globalColors), [globalColors]);
  const matDisabledSet = useMemo(() => buildMatDisabledSet(globalColors), [globalColors]);

  useLayoutEffect(() => {
    if (!modalOpen) return;
    const portal = portalRootRef.current;
    if (!portal) return;

    const toRestore: HTMLElement[] = [];
    for (const node of Array.from(document.body.children)) {
      if (!(node instanceof HTMLElement)) continue;
      if (node === portal) continue;
      node.inert = true;
      toRestore.push(node);
    }
    return () => {
      for (const el of toRestore) {
        el.inert = false;
      }
    };
  }, [modalOpen]);

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
          <div ref={portalRootRef} data-mini-configurator-portal>
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
              metadata={metadata}
              globalColors={globalColors}
              colorMap={colorMap}
              coloredSet={coloredSet}
              mirrorSet={mirrorSet}
              matDisabledSet={matDisabledSet}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
