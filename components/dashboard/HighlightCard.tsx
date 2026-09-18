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
    <div className="flex items-start gap-3 rounded-2xl bg-neutral-900 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xl">
        {icon}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm text-neutral-400">{title}</p>
        {sellerName ? (
          <>
            <p className="truncate text-lg font-semibold tracking-tight text-neutral-50">
              {sellerName}
            </p>
            {value && <p className="text-sm text-emerald-400">{value}</p>}
          </>
        ) : (
          <p className="mt-1 text-sm text-neutral-600">Sem dados suficientes</p>
        )}
      </div>
    </div>
  );
}
