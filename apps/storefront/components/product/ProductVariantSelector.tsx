"use client";

export interface ProductOption {
  id: string;
  title: string;
  values: string[];
}

interface ProductVariantSelectorProps {
  options: ProductOption[];
  selectedOptions: Record<string, string>;
  onOptionChange: (optionTitle: string, value: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  czarny: "#1a1a1a",
  biały: "#ffffff",
  złoty: "#D4AF37",
  "rose gold": "#B76E79",
  srebrny: "#C0C0C0",
  przezroczysty: "transparent",
  różowy: "#E8A0BF",
  beżowy: "#D4C5B2",
  szary: "#8B8B8B",
  brązowy: "#6B4226",
};

function isColorOption(title: string): boolean {
  return title.toLowerCase() === "kolor";
}

function isSizeOption(title: string): boolean {
  return title.toLowerCase() === "rozmiar";
}

function isLedOption(title: string): boolean {
  return title.toLowerCase() === "led";
}

export function ProductVariantSelector({
  options,
  selectedOptions,
  onOptionChange,
}: ProductVariantSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-5">
      {options.map((option) => {
        if (isColorOption(option.title)) {
          return (
            <fieldset key={option.id}>
              <legend className="mb-2 text-sm font-medium text-brand-700">
                {option.title}: <span className="font-normal text-brand-500">{selectedOptions[option.title] ?? ""}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.title] === value;
                  const hex = COLOR_MAP[value.toLowerCase()] ?? "#ccc";
                  const isTransparent = value.toLowerCase() === "przezroczysty";
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onOptionChange(option.title, value)}
                      className={`relative h-9 w-9 rounded-full border-2 transition-all ${
                        isSelected
                          ? "border-accent ring-2 ring-accent/30"
                          : "border-brand-200 hover:border-brand-400"
                      }`}
                      style={{ backgroundColor: hex }}
                      title={value}
                      aria-pressed={isSelected}
                      aria-label={value}
                    >
                      {isTransparent && (
                        <span className="absolute inset-1 rounded-full border border-dashed border-brand-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        }

        if (isSizeOption(option.title)) {
          return (
            <fieldset key={option.id}>
              <legend className="mb-2 text-sm font-medium text-brand-700">{option.title}</legend>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.title] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onOptionChange(option.title, value)}
                      className={`flex flex-col items-center justify-center rounded-lg border px-5 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? "border-accent bg-accent/10 text-accent-dark font-medium"
                          : "border-brand-200 text-brand-700 hover:border-brand-400"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        }

        if (isLedOption(option.title)) {
          return (
            <fieldset key={option.id}>
              <legend className="mb-2 text-sm font-medium text-brand-700">{option.title}</legend>
              <div className="flex gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.title] === value;
                  const isYes = value.toLowerCase() === "tak";
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onOptionChange(option.title, value)}
                      className={`flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? "border-accent bg-accent/10 text-accent-dark font-medium"
                          : "border-brand-200 text-brand-700 hover:border-brand-400"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {isYes && <span className="text-base">💡</span>}
                      {isYes ? "Z LED" : "Bez LED"}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        }

        return (
          <fieldset key={option.id}>
            <legend className="mb-2 text-sm font-medium text-brand-700">{option.title}</legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isSelected = selectedOptions[option.title] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onOptionChange(option.title, value)}
                    className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? "border-accent bg-accent/10 text-accent-dark font-medium"
                        : "border-brand-200 text-brand-700 hover:border-brand-400"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
