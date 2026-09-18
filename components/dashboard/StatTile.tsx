const TONE_CLASS = {
  neutral: "text-neutral-50",
  positive: "text-emerald-400",
  warning: "text-amber-400",
} as const;

export function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: keyof typeof TONE_CLASS;
}) {
  return (
    <div className="rounded-2xl bg-neutral-900 p-5">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className={`mt-2 truncate text-3xl font-semibold tracking-tight tabular-nums ${TONE_CLASS[tone]}`}>
        {value}
      </p>
    </div>
  );
}
