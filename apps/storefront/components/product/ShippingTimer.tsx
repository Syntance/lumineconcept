export function ShippingTimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-2.5 text-sm text-green-800">
      <span aria-hidden="true">🚚</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span>Zamów express — realizacja w 72 godziny</span>
        <span className="text-xs text-green-700/90">+50% wartości zamówienia</span>
      </span>
    </div>
  );
}
