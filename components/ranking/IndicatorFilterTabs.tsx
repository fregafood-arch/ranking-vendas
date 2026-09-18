import Link from "next/link";

function tabClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
    : "rounded-full px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-100";
}

export function IndicatorFilterTabs({
  indicators,
  activeIndicatorId,
  periodId,
}: {
  indicators: { id: string; name: string }[];
  activeIndicatorId: string | null;
  periodId: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/ranking?period=${periodId}`} className={tabClass(activeIndicatorId === null)}>
        Geral
      </Link>
      {indicators.map((indicator) => (
        <Link
          key={indicator.id}
          href={`/ranking/${indicator.id}?period=${periodId}`}
          className={tabClass(activeIndicatorId === indicator.id)}
        >
          {indicator.name}
        </Link>
      ))}
    </div>
  );
}
