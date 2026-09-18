"use client";

import { useRouter } from "next/navigation";

export function PeriodPicker({
  periods,
  selectedId,
  basePath,
}: {
  periods: { id: string; label: string }[];
  selectedId: string | null;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedId ?? ""}
      onChange={(event) => router.push(`${basePath}?period=${event.target.value}`)}
      className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500"
    >
      {periods.map((period) => (
        <option key={period.id} value={period.id}>
          {period.label}
        </option>
      ))}
    </select>
  );
}
