"use client";

import { Package, Truck } from "lucide-react";
import { useInPostPoints } from "@/hooks/useInPostPoints";
import { formatPrice } from "@/lib/utils";

const SHIPPING_OPTIONS = [
  {
    id: "inpost_parcel_locker",
    name: "InPost Paczkomat",
    price: 1299,
    estimated: "1-2 dni robocze",
    icon: Package,
    description: "Odbiór w wybranym paczkomacie 24/7",
  },
  {
    id: "inpost_courier",
    name: "InPost Kurier",
    price: 1599,
    estimated: "1-2 dni robocze",
    icon: Truck,
    description: "Dostawa pod wskazany adres",
  },
  {
    id: "dpd_courier",
    name: "DPD Kurier",
    price: 1899,
    estimated: "1-3 dni robocze",
    icon: Truck,
    description: "Dostawa kurierem DPD",
  },
] as const;

interface ShippingSelectorProps {
  selectedOptionId: string;
  onSelect: (optionId: string) => void;
  onInPostLockerSelect: (lockerId: string) => void;
}

export function ShippingSelector({
  selectedOptionId,
  onSelect,
  onInPostLockerSelect,
}: ShippingSelectorProps) {
  const { selectedPoint, openMap } = useInPostPoints();

  const handleSelect = (optionId: string) => {
    onSelect(optionId);
    if (optionId === "inpost_parcel_locker") {
      openMap("inpost-map");
    }
  };

  return (
    <div className="space-y-3">
      {SHIPPING_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedOptionId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            className={`w-full flex items-start gap-4 rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? "border-accent bg-accent/5"
                : "border-brand-200 hover:border-brand-300"
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                isSelected ? "border-accent" : "border-brand-300"
              }`}
            >
              {isSelected && (
                <div className="h-2.5 w-2.5 rounded-full bg-accent" />
              )}
            </div>
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-brand-900">
                  {option.name}
                </span>
                <span className="text-sm font-semibold text-brand-900">
                  {formatPrice(option.price)}
                </span>
              </div>
              <p className="text-xs text-brand-500 mt-0.5">
                {option.description} · {option.estimated}
              </p>
            </div>
          </button>
        );
      })}

      {selectedOptionId === "inpost_parcel_locker" && (
        <div className="mt-4">
          {selectedPoint ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Wybrany paczkomat: {selectedPoint.name}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {selectedPoint.address.line1}, {selectedPoint.address.line2}
              </p>
              <button
                type="button"
                onClick={() => {
                  openMap("inpost-map");
                  onInPostLockerSelect("");
                }}
                className="mt-2 text-xs font-medium text-green-700 underline"
              >
                Zmień paczkomat
              </button>
            </div>
          ) : (
            <div
              id="inpost-map"
              className="h-96 w-full rounded-lg border border-brand-200 bg-brand-50"
              aria-label="Mapa paczkomatów InPost"
            />
          )}
        </div>
      )}
    </div>
  );
}
