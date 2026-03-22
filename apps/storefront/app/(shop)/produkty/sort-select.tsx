"use client";

export function SortSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set("sort", e.target.value);
        window.location.href = url.toString();
      }}
      className="rounded-md border border-brand-200 px-3 py-2 text-sm text-brand-700"
      aria-label="Sortowanie"
    >
      <option value="-created_at">Najnowsze</option>
      <option value="created_at">Najstarsze</option>
      <option value="title">Nazwa A-Z</option>
      <option value="-title">Nazwa Z-A</option>
    </select>
  );
}
