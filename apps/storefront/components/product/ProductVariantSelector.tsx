"use client";

interface ProductOption {
  id: string;
  title: string;
  values: string[];
}

interface ProductVariantSelectorProps {
  options: ProductOption[];
  selectedOptions: Record<string, string>;
  onOptionChange: (optionTitle: string, value: string) => void;
}

export function ProductVariantSelector({
  options,
  selectedOptions,
  onOptionChange,
}: ProductVariantSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <fieldset key={option.id}>
          <legend className="text-sm font-medium text-brand-900">
            {option.title}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
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
      ))}
    </div>
  );
}
