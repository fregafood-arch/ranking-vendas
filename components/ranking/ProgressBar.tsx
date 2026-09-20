export function ProgressBar({
  percent,
  className = "h-2 w-24",
}: {
  percent: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const overAchieved = percent > 100;

  return (
    <div className={`overflow-hidden rounded-full bg-neutral-800 ${className}`}>
      <div
        className={
          overAchieved
            ? "h-full bg-gradient-to-r from-blue-500 to-blue-300"
            : "h-full bg-gradient-to-r from-blue-700 to-blue-500"
        }
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
