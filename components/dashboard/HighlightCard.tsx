export function HighlightCard({
  icon,
  title,
  sellerName,
  value,
}: {
  icon: string;
  title: string;
  sellerName: string | null;
  value: string | null;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <span className="text-xl">{icon}</span>
        {title}
      </div>
      {sellerName ? (
        <>
          <p className="mt-2 truncate text-lg font-semibold text-neutral-50">{sellerName}</p>
          {value && <p className="text-sm text-emerald-400">{value}</p>}
        </>
      ) : (
        <p className="mt-2 text-sm text-neutral-600">Sem dados suficientes</p>
      )}
    </div>
  );
}
