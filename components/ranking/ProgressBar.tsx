export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const overAchieved = percent > 100;

  return (
    <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-800">
      <div
        className={overAchieved ? "h-full bg-emerald-400" : "h-full bg-emerald-600"}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
