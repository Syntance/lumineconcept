export function ShippingTimer() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  let label: string;
  if (day === 0 || day === 6) {
    label = "Zamów teraz — wysyłka w poniedziałek";
  } else if (hour < 14) {
    label = "Zamów do 14:00 — wysyłka dziś";
  } else if (day === 5) {
    label = "Zamów teraz — wysyłka w poniedziałek";
  } else {
    label = "Zamów teraz — wysyłka jutro";
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-2.5 text-sm text-green-800">
      <span aria-hidden="true">🚚</span>
      <span>{label}</span>
    </div>
  );
}
