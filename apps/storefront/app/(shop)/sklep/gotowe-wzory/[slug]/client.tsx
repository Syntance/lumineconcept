"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ProductConfigurator,
  type ColorCustomization,
} from "@/components/product/ProductConfigurator";
import type { UploadedFile } from "@/components/product/FileUploadSection";
import {
  type TextFieldDef,
  parseTextFieldsFromMetadata,
} from "@/lib/products/text-fields";
import {
  getStorefrontUploadCount,
  isProductUploadComplete,
  parseUploadSettingsFromMetadata,
} from "@/lib/products/upload-settings";
import {
  CUSTOM_COLOR_VALUE,
  isColorOption,
  isEveryColorOptionChosen,
} from "@/components/product/ProductVariantSelector";
import {
  buildColorMap,
  buildColoredSet,
  buildCustomSet,
  buildMirrorSet,
  buildMatDisabledSet,
  mergeGlobalAndProductColors,
  parseAllowCustomColor,
  type GlobalConfigOption,
} from "@/lib/products/global-config";
import type { ColorCategoryDefinition } from "@/lib/products/color-categories";
import {
  buildMatDisabledSetForSlot,
  flattenProductColorsForSlot,
  parseMatOverridesBySlot,
  parseMatOverridesBySlotWithStand,
  parseAllowCustomColorBySlot,
  parseDisabledColorCategoriesBySlot,
  parseDisabledConfigIds,
  parseDisabledConfigIdsBySlot,
  parseProductColorsBySlot,
  resolveColorSlotTitles,
} from "@/lib/products/color-slot-config";
import {
  buildStandColorMaps,
  parseDisabledColorCategoriesBySlotWithStand,
  parseDisabledConfigIdsBySlotWithStand,
  parseStandProductColors,
  formatStandSurchargePln,
  STAND_COLOR_OPTION_TITLE,
} from "@/lib/products/stand-config";
import { ColorStepPanel } from "@/components/product/ColorStepPanel";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ExpressToggle } from "@/components/cart/ExpressToggle";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { productToItem } from "@/lib/analytics/medusa-items";
import { DeliveryInfoBlock } from "@/components/product/DeliveryInfoBlock";
import { DeliveryTrustBadges } from "@/components/product/DeliveryTrustBadges";
import {
	MIN_ORDER_QUANTITY_META_KEY,
	serializeMinOrderQuantityForMetadata,
} from "@/lib/products/min-order-quantity";

interface CheckoutCallout {
  enabled?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
}

interface ProductPageClientProps {
  product: {
    id: string;
    title: string;
    options: Array<{ id: string; title: string; values: string[] }>;
    variants: Array<{
      id: string;
      title: string;
      options: Record<string, string>;
      price: number;
      inventory_quantity: number;
      /** false = bez śledzenia stanu (Medusa), zawsze można zamówić */
      manage_inventory?: boolean;
    }>;
    metadata?: Record<string, unknown>;
    images?: Array<{ id: string; url: string; alt?: string }>;
  };
  checkoutCallout?: CheckoutCallout | null;
  globalColors?: GlobalConfigOption[];
  colorCategories?: ColorCategoryDefinition[];
  schemaImageUrl?: string | null;
  certificateStandAvailable?: boolean;
  /** Dopłata za podstawkę w groszach (0 = gratis). */
  standSurchargeGrosze?: number;
  /** Minimalna liczba sztuk w zamówieniu */
  minOrderQuantity?: number;
}

function extractMetaKey(optionTitle: string): string {
  const lower = optionTitle.toLowerCase().replace(/\s+/g, "_");
  if (lower === "kolor") return "kolor";
  return lower.replace(/^kolor_/, "");
}

export function ProductPageClient({
  product,
  checkoutCallout,
  globalColors = [],
  colorCategories = [],
  schemaImageUrl,
  certificateStandAvailable = false,
  standSurchargeGrosze = 0,
  minOrderQuantity = 1,
}: ProductPageClientProps) {
  const { track } = useAnalytics();
  const colorOptionTitles = useMemo(
    () => resolveColorSlotTitles(product.options, product.metadata),
    [product.options, product.metadata],
  );

  const productColorsBySlot = useMemo(
    () => parseProductColorsBySlot(product.metadata, colorOptionTitles),
    [product.metadata, colorOptionTitles],
  );

  const productColorsBySlotFlat = useMemo(() => {
    const result: Record<string, ReturnType<typeof flattenProductColorsForSlot>> = {};
    for (const title of colorOptionTitles) {
      result[title] = flattenProductColorsForSlot(productColorsBySlot[title]);
    }
    return result;
  }, [productColorsBySlot, colorOptionTitles]);

  const mergedColors = useMemo(() => {
    const allProductColors = colorOptionTitles.flatMap(
      (title) => productColorsBySlotFlat[title] ?? [],
    );
    return mergeGlobalAndProductColors(globalColors, allProductColors);
  }, [globalColors, colorOptionTitles, productColorsBySlotFlat]);

  const colorMap = useMemo(() => buildColorMap(mergedColors), [mergedColors]);
  const coloredSet = useMemo(() => buildColoredSet(mergedColors), [mergedColors]);
  const mirrorSet = useMemo(() => buildMirrorSet(mergedColors), [mergedColors]);
  const customSet = useMemo(() => buildCustomSet(mergedColors), [mergedColors]);
  const matDisabledSet = useMemo(() => buildMatDisabledSet(mergedColors), [mergedColors]);

  const [includeCertificateStand, setIncludeCertificateStand] = useState(false);

  const matOverridesBySlotBase = useMemo(
    () => parseMatOverridesBySlot(product.metadata, colorOptionTitles),
    [product.metadata, colorOptionTitles],
  );

  const matOverridesBySlot = useMemo(() => {
    if (!certificateStandAvailable || !includeCertificateStand) {
      return matOverridesBySlotBase;
    }
    return parseMatOverridesBySlotWithStand(
      product.metadata,
      colorOptionTitles,
      matOverridesBySlotBase,
    );
  }, [
    certificateStandAvailable,
    includeCertificateStand,
    product.metadata,
    colorOptionTitles,
    matOverridesBySlotBase,
  ]);

  const allowCustomColor = useMemo(
    () => parseAllowCustomColor(product.metadata),
    [product.metadata],
  );
  const legacyDisabledIds = useMemo(
    () => parseDisabledConfigIds(product.metadata),
    [product.metadata],
  );
  const legacyColorDisabledIds = useMemo(() => {
    const colorIds = new Set(globalColors.map((c) => c.id));
    return legacyDisabledIds.filter((id) => colorIds.has(id));
  }, [legacyDisabledIds, globalColors]);

  const disabledConfigIdsBySlotBase = useMemo(
    () =>
      parseDisabledConfigIdsBySlot(
        product.metadata,
        colorOptionTitles,
        legacyColorDisabledIds,
      ),
    [product.metadata, colorOptionTitles, legacyColorDisabledIds],
  );

  const disabledColorCategoriesBySlotBase = useMemo(
    () => parseDisabledColorCategoriesBySlot(product.metadata, colorOptionTitles),
    [product.metadata, colorOptionTitles],
  );

  const disabledConfigIdsBySlot = useMemo(() => {
    if (!certificateStandAvailable || !includeCertificateStand) {
      return disabledConfigIdsBySlotBase;
    }
    return parseDisabledConfigIdsBySlotWithStand(
      product.metadata,
      colorOptionTitles,
      disabledConfigIdsBySlotBase,
    );
  }, [
    certificateStandAvailable,
    includeCertificateStand,
    product.metadata,
    colorOptionTitles,
    disabledConfigIdsBySlotBase,
  ]);

  const disabledColorCategoriesBySlot = useMemo(() => {
    if (!certificateStandAvailable || !includeCertificateStand) {
      return disabledColorCategoriesBySlotBase;
    }
    return parseDisabledColorCategoriesBySlotWithStand(
      product.metadata,
      colorOptionTitles,
      disabledColorCategoriesBySlotBase,
    );
  }, [
    certificateStandAvailable,
    includeCertificateStand,
    product.metadata,
    colorOptionTitles,
    disabledColorCategoriesBySlotBase,
  ]);
  const allowCustomColorBySlot = useMemo(
    () =>
      parseAllowCustomColorBySlot(
        product.metadata,
        colorOptionTitles,
        allowCustomColor,
      ),
    [product.metadata, colorOptionTitles, allowCustomColor],
  );

  const matDisabledSetBySlot = useMemo(() => {
    const result: Record<string, Set<string>> = {};
    for (const title of colorOptionTitles) {
      result[title] = buildMatDisabledSetForSlot(
        title,
        globalColors,
        productColorsBySlotFlat[title] ?? [],
        matOverridesBySlot,
        disabledConfigIdsBySlot,
        disabledColorCategoriesBySlot,
      );
    }
    return result;
  }, [
    colorOptionTitles,
    globalColors,
    productColorsBySlotFlat,
    matOverridesBySlot,
    disabledConfigIdsBySlot,
    disabledColorCategoriesBySlot,
  ]);

  const nonColorOptions = useMemo(
    () => product.options.filter((o) => !isColorOption(o.title)),
    [product.options],
  );

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const title of colorOptionTitles) {
      initial[title] = "";
    }
    for (const option of nonColorOptions) {
      if (option.values[0]) {
        initial[option.title] = option.values[0];
      }
    }
    return initial;
  });

  const [colorCustomizations, setColorCustomizations] = useState<
    Record<string, ColorCustomization>
  >(() => {
    const initial: Record<string, ColorCustomization> = {};
    for (const title of colorOptionTitles) {
      initial[title] = { customColor: null, matFinish: false };
    }
    return initial;
  });

  const textFields = useMemo<TextFieldDef[]>(() => {
    return parseTextFieldsFromMetadata(product.metadata);
  }, [product.metadata]);

  const [textFieldValues, setTextFieldValues] = useState<Record<string, string>>({});

  const standProductColorsFlat = useMemo(
    () => flattenProductColorsForSlot(parseStandProductColors(product.metadata)),
    [product.metadata],
  );

  const standColorConfig = useMemo(
    () =>
      buildStandColorMaps(
        globalColors,
        standProductColorsFlat,
        product.metadata ?? {},
      ),
    [globalColors, standProductColorsFlat, product.metadata],
  );

  const [standSelectedColor, setStandSelectedColor] = useState("");
  const [standColorCustomization, setStandColorCustomization] =
    useState<ColorCustomization>({ customColor: null, matFinish: false });

  useEffect(() => {
    setTextFieldValues((prev) => {
      const next: Record<string, string> = {};
      for (const f of textFields) {
        next[f.key] = prev[f.key] ?? "";
      }
      return next;
    });
  }, [textFields]);

  const handleTextFieldChange = useCallback((key: string, value: string) => {
    setTextFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const allTextFieldsValid = useMemo(() => {
    return textFields
      .filter((f) => f.required)
      .every((f) => (textFieldValues[f.key] ?? "").trim().length > 0);
  }, [textFields, textFieldValues]);

  const allColorChoicesComplete = useMemo(
    () =>
      isEveryColorOptionChosen(
        colorOptionTitles,
        selectedOptions,
        colorCustomizations,
      ),
    [colorOptionTitles, selectedOptions, colorCustomizations],
  );

  const standColorComplete = useMemo(() => {
    if (!certificateStandAvailable || !includeCertificateStand) return true;
    return isEveryColorOptionChosen(
      [STAND_COLOR_OPTION_TITLE],
      { [STAND_COLOR_OPTION_TITLE]: standSelectedColor },
      { [STAND_COLOR_OPTION_TITLE]: standColorCustomization },
    );
  }, [
    certificateStandAvailable,
    includeCertificateStand,
    standSelectedColor,
    standColorCustomization,
  ]);

  const linksCount = useMemo(() => {
    const raw = product.metadata?.links_count;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [product.metadata]);

  const [links, setLinks] = useState<string[]>(() =>
    Array.from({ length: linksCount }, () => ""),
  );

  const allLinksProvided = linksCount === 0 || links.slice(0, linksCount).every((l) => l.trim().length > 0);

  const uploadSettings = useMemo(
    () => parseUploadSettingsFromMetadata(product.metadata as Record<string, unknown>),
    [product.metadata],
  );

  const uploadsCount = useMemo(
    () => getStorefrontUploadCount(uploadSettings),
    [uploadSettings],
  );

  const uploadsLabel = useMemo(
    () => (uploadSettings.label ? uploadSettings.label : undefined),
    [uploadSettings.label],
  );

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const uploadsComplete = isProductUploadComplete(uploadSettings, uploadedFiles.length);

  const ctaRef = useRef<HTMLDivElement>(null);
  const configuratorRef = useRef<HTMLDivElement>(null);
  const [calloutAction, setCalloutAction] = useState<
    "cart" | "checkout" | null
  >(null);
  const [showIncompleteConfigBanner, setShowIncompleteConfigBanner] =
    useState(false);
  /** true = kliknięto „Kup teraz”, false = „Dodaj do koszyka” */
  const [incompleteModalFromCheckout, setIncompleteModalFromCheckout] =
    useState(false);

  const selectedVariant = product.variants.find((variant) =>
    Object.entries(selectedOptions).every(([key, value]) => {
      if (isColorOption(key)) return true;
      return variant.options[key] === value;
    }),
  );

  const basePrice = useMemo(() => {
    const raw = product.metadata?.base_price;
    if (raw === undefined || raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [product.metadata]);

  const variantHasPrice = selectedVariant?.price != null && selectedVariant.price > 0;
  const baseDisplayPrice = variantHasPrice ? selectedVariant.price : (basePrice ?? 0);
  const standAddonPln =
    certificateStandAvailable && includeCertificateStand ? standSurchargeGrosze / 100 : 0;
  const displayPrice = Math.round((baseDisplayPrice + standAddonPln) * 100) / 100;

  useEffect(() => {
    track("product_view", {
      item_id: product.id,
      item_name: product.title,
      value: displayPrice,
      currency: "PLN",
      items: [
        productToItem({
          id: product.id,
          title: product.title,
          price: displayPrice,
        }),
      ],
    });
  }, [product.id, product.title, displayPrice, track]);

  useEffect(() => {
    if (!calloutAction) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCalloutAction(null);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [calloutAction]);

  useEffect(() => {
    if (!showIncompleteConfigBanner) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowIncompleteConfigBanner(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showIncompleteConfigBanner]);

  const handleOptionChange = (optionTitle: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionTitle]: value }));
  };

  const handleColorCustomizationChange = (
    optionTitle: string,
    field: "customColor" | "matFinish",
    value: string | boolean | null,
  ) => {
    setColorCustomizations((prev) => {
      // Stan może jeszcze nie zawierać wpisu dla tej opcji (lazy-init, nowy kolor).
      // Dobieramy domyślne wartości `ColorCustomization`, żeby spełnić umowę typu.
      const current: ColorCustomization = prev[optionTitle] ?? {
        customColor: null,
        matFinish: false,
      };
      return {
        ...prev,
        [optionTitle]: { ...current, [field]: value },
      };
    });
  };

  const buildMetadata = useCallback(():
    | Record<string, string>
    | undefined => {
    const meta: Record<string, string> = {};

    for (const field of textFields) {
      const val = textFieldValues[field.key]?.trim();
      if (val) meta[`text_${field.key}`] = val;
    }

    for (const title of colorOptionTitles) {
      const key = extractMetaKey(title);
      const sel = selectedOptions[title];
      if (sel && sel !== CUSTOM_COLOR_VALUE) {
        meta[`color_${key}`] = sel;
        const hex = colorMap[sel.toLowerCase()];
        if (hex) meta[`color_${key}_hex`] = hex;
      }
      const cust = colorCustomizations[title];
      if (cust?.customColor) {
        meta[`color_${key}_custom`] = cust.customColor;
      }
      if (cust?.matFinish) {
        meta[`color_${key}_mat`] = "true";
      }
    }

    for (let i = 0; i < linksCount; i++) {
      const url = links[i]?.trim();
      if (url) meta[`link_${i + 1}`] = url;
    }

    uploadedFiles.forEach((f, i) => {
      if (f?.url) meta[`file_${i + 1}`] = f.url;
    });

    if (certificateStandAvailable && includeCertificateStand) {
      meta.certificate_stand = "true";
      const standKey = extractMetaKey(STAND_COLOR_OPTION_TITLE);
      const standSel = standSelectedColor;
      if (standSel && standSel !== CUSTOM_COLOR_VALUE) {
        meta[`color_${standKey}`] = standSel;
        const hex = standColorConfig.colorMap[standSel.toLowerCase()];
        if (hex) meta[`color_${standKey}_hex`] = hex;
      }
      if (standColorCustomization.customColor) {
        meta[`color_${standKey}_custom`] = standColorCustomization.customColor;
      }
      if (standColorCustomization.matFinish) {
        meta[`color_${standKey}_mat`] = "true";
      }
    }

    meta[MIN_ORDER_QUANTITY_META_KEY] = serializeMinOrderQuantityForMetadata(minOrderQuantity);

    return Object.keys(meta).length > 0 ? meta : undefined;
  }, [
    textFields,
    textFieldValues,
    colorCustomizations,
    colorOptionTitles,
    selectedOptions,
    links,
    linksCount,
    uploadedFiles,
    certificateStandAvailable,
    includeCertificateStand,
    standSelectedColor,
    standColorCustomization,
    standColorConfig.colorMap,
    colorMap,
    minOrderQuantity,
  ]);

  const calloutEnabled =
    checkoutCallout?.enabled !== false && !!checkoutCallout?.message;

  const uploadBlocksAddToCart =
    uploadSettings.enabled &&
    uploadSettings.required &&
    !uploadsComplete;

  const configIncomplete =
    uploadBlocksAddToCart ||
    !allLinksProvided ||
    !allTextFieldsValid ||
    (!allColorChoicesComplete && colorOptionTitles.length > 0) ||
    !standColorComplete;

  useEffect(() => {
    if (!includeCertificateStand) {
      setStandSelectedColor("");
      setStandColorCustomization({ customColor: null, matFinish: false });
    }
  }, [includeCertificateStand]);

  useEffect(() => {
    if (!configIncomplete) {
      setShowIncompleteConfigBanner(false);
    }
  }, [configIncomplete]);

  const handleFinishConfigNavigation = useCallback(() => {
    setShowIncompleteConfigBanner(false);
    requestAnimationFrame(() => {
      const el = configuratorRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.focus({ preventScroll: true });
    });
  }, []);

  const handleBeforeAdd = useCallback(
    ({ checkoutAfterAdd }: { checkoutAfterAdd: boolean }) => {
      if (configIncomplete) {
        setIncompleteModalFromCheckout(checkoutAfterAdd);
        setShowIncompleteConfigBanner(true);
        return true;
      }
      if (calloutEnabled) {
        setCalloutAction("cart");
        return true;
      }
      return false;
    },
    [configIncomplete, calloutEnabled],
  );

  /** Medusa: manage_inventory === true → limit ze stanu; false/undefined → na zamówienie (bez limitu ze sklepu) */
  const tracksInventory = selectedVariant?.manage_inventory === true;
  const stockQty = selectedVariant?.inventory_quantity ?? 0;
  const availableToOrder =
    !!selectedVariant &&
    (!tracksInventory || stockQty >= minOrderQuantity);
  const maxOrderQty = !tracksInventory ? 99 : stockQty;

  const standSection =
    certificateStandAvailable ? (
      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-none border border-brand-200 bg-white px-4 py-3 text-sm text-brand-800 shadow-sm transition-colors hover:border-brand-300">
          <input
            type="checkbox"
            checked={includeCertificateStand}
            onChange={(e) => setIncludeCertificateStand(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-none border-brand-300 accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
          <span className="font-semibold">
            {standSurchargeGrosze > 0
              ? `Dodaj podstawkę (+${formatStandSurchargePln(standSurchargeGrosze)} zł)`
              : "Dodaj podstawkę (w cenie)"}
          </span>
        </label>
        {includeCertificateStand && standColorConfig.values.length > 0 ? (
          <ColorStepPanel
            option={{
              id: "stand-color",
              title: STAND_COLOR_OPTION_TITLE,
              values: standColorConfig.values,
            }}
            selectedColor={standSelectedColor}
            onColorChange={setStandSelectedColor}
            customColor={standColorCustomization.customColor}
            onCustomColorChange={(hex) =>
              setStandColorCustomization((prev) => ({
                ...prev,
                customColor: hex,
              }))
            }
            matFinish={standColorCustomization.matFinish}
            onMatFinishChange={(enabled) =>
              setStandColorCustomization((prev) => ({
                ...prev,
                matFinish: enabled,
              }))
            }
            colorMap={standColorConfig.colorMap}
            coloredSet={coloredSet}
            mirrorSet={mirrorSet}
            customSet={customSet}
            matDisabledSet={standColorConfig.matDisabledSet}
            allowCustomColor={standColorConfig.allowCustom}
            customCategoryEnabled={standColorConfig.customCategoryEnabled}
            colorCategories={colorCategories}
            categoryByColorName={standColorConfig.categoryByColorName}
          />
        ) : null}
      </div>
    ) : null;

  return (
    <>
      <div className="space-y-6">
        <div
          ref={configuratorRef}
          className="scroll-mt-24 md:scroll-mt-28"
          tabIndex={-1}
        >
          <ProductConfigurator
            options={nonColorOptions}
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
            colorCustomizations={colorCustomizations}
            onColorCustomizationChange={handleColorCustomizationChange}
            textFields={textFields}
            textFieldValues={textFieldValues}
            onTextFieldChange={handleTextFieldChange}
            linksCount={linksCount}
            links={links}
            onLinksChange={setLinks}
            uploadsCount={uploadsCount}
            uploadsRequired={uploadSettings.required}
            uploadsLabel={uploadsLabel}
            uploadedFiles={uploadedFiles}
            onUploadedFilesChange={setUploadedFiles}
            globalColors={globalColors}
            colorOptionTitles={colorOptionTitles}
            colorMap={colorMap}
            coloredSet={coloredSet}
            mirrorSet={mirrorSet}
            customSet={customSet}
            matDisabledSet={matDisabledSet}
            matDisabledSetBySlot={matDisabledSetBySlot}
            allowCustomColor={allowCustomColor}
            disabledConfigIdsBySlot={disabledConfigIdsBySlot}
            disabledColorCategoriesBySlot={disabledColorCategoriesBySlot}
            allowCustomColorBySlot={allowCustomColorBySlot}
            productColorsBySlot={productColorsBySlotFlat}
            colorCategories={colorCategories}
            schemaImageUrl={schemaImageUrl}
            beforeTextFields={standSection}
          />
        </div>

        {selectedVariant && tracksInventory && stockQty > 5 && (
          <p className="flex items-center gap-1.5 text-sm text-green-700">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            W magazynie — realizacja ok. 10 dni roboczych
          </p>
        )}
        {selectedVariant && tracksInventory && stockQty > 0 && stockQty <= 5 && (
          <p className="flex items-center gap-1.5 text-sm text-orange-600 animate-pulse">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
            Ostatnie {stockQty} szt. w magazynie!
          </p>
        )}
        {selectedVariant && tracksInventory && stockQty === 0 && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Produkt chwilowo niedostępny
          </p>
        )}

        <div ref={ctaRef} className="space-y-4">
          <ExpressToggle />
          {minOrderQuantity > 1 ? (
            <p className="text-sm text-brand-600">
              Minimalne zamówienie: {minOrderQuantity} szt.
            </p>
          ) : null}
          <AddToCartButton
            variantId={selectedVariant?.id ?? null}
            productData={{
              id: product.id,
              title: product.title,
              price: displayPrice,
              currency: "PLN",
              thumbnail: product.images?.[0]?.url,
            }}
            disabled={!selectedVariant || !availableToOrder}
            maxQuantity={maxOrderQty}
            minQuantity={minOrderQuantity}
            onBeforeAdd={handleBeforeAdd}
            metadata={buildMetadata()}
          />
        </div>

        <div className="mt-8 space-y-10">
          <DeliveryInfoBlock />
          <DeliveryTrustBadges price={displayPrice} />
        </div>
      </div>

      {/* Sticky bar usunięty — na mobile użytkownik scrolluje do przycisku */}

      {showIncompleteConfigBanner && configIncomplete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setShowIncompleteConfigBanner(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="incomplete-config-title"
        >
          <div
            className="w-full max-w-md rounded-none border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-50/80 px-5 py-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id="incomplete-config-title"
              className="font-display text-base font-semibold tracking-wide text-brand-800"
            >
              Jeszcze chwila — dokończ konfigurację
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-800">
              {incompleteModalFromCheckout
                ? "Żeby przejść dalej, uzupełnij poniższe elementy:"
                : "Żeby dodać produkt do koszyka, uzupełnij poniższe elementy:"}
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-brand-800">
              {!allColorChoicesComplete && colorOptionTitles.length > 0 && (
                <li>Wybierz kolor dla każdego etapu konfiguracji</li>
              )}
              {!allTextFieldsValid && (
                <li>Uzupełnij wymagane pola tekstowe</li>
              )}
              {!allLinksProvided && (
                <li>Podaj wszystkie wymagane linki do kodów QR</li>
              )}
              {uploadBlocksAddToCart && (
                <li>Wgraj co najmniej jeden plik w sekcji wgrywania treści</li>
              )}
            </ul>
            <button
              type="button"
              onClick={handleFinishConfigNavigation}
              className="mt-5 w-full rounded-none bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Dokończ konfigurację
            </button>
          </div>
        </div>
      )}

      {calloutAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setCalloutAction(null)}
          role="dialog"
          aria-modal="true"
          aria-label={checkoutCallout?.title ?? "Informacja"}
        >
          <div
            className="mx-4 w-full max-w-md rounded-none border border-brand-200 bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {checkoutCallout?.title && (
              <h2 className="font-display text-lg tracking-wide text-brand-800">
                {checkoutCallout.title}
              </h2>
            )}
            {checkoutCallout?.message && (
              <p className="mt-3 text-sm leading-relaxed text-brand-800 whitespace-pre-line">
                {checkoutCallout.message}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const action = calloutAction;
                  setCalloutAction(null);
                  if (action === "checkout") {
                    // Twarda nawigacja — `router.push` potrafił w produkcji
                    // (Opera) zostać na tej samej stronie przy przejściu
                    // z PDP na checkout. Spójnie z AddToCartButton.
                    if (typeof window !== "undefined") {
                      window.location.assign("/checkout");
                    }
                  } else if (action === "cart") {
                    window.dispatchEvent(new Event("callout-confirmed-cart"));
                  }
                }}
                className="w-full rounded-none bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
              >
                {checkoutCallout?.confirmLabel ?? "Rozumiem, kontynuuj"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalloutAction(null);
                  window.dispatchEvent(new Event("callout-cancelled"));
                }}
                className="w-full rounded-none border border-brand-200 px-6 py-2.5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
