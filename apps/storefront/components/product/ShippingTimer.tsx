export function ShippingTimer() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <span aria-hidden="true">⚡</span>
      <div className="flex flex-col">
        <span className="font-medium">Zamów express — realizacja w 72 godziny</span>
        <span className="text-xs text-amber-700">+50% wartości zamówienia</span>
      </div>
    </div>
  );
}
