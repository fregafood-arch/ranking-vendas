export function AchievementBadge({
  icon,
  name,
  earnedAt,
}: {
  icon: string;
  name: string;
  earnedAt?: string | null;
}) {
  return (
    <div
      title={earnedAt ? `${name} — ${new Date(earnedAt).toLocaleDateString("pt-BR")}` : name}
      className="flex flex-col items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
    >
      <span className="text-2xl">{icon}</span>
      <span className="max-w-24 truncate text-center text-xs text-neutral-300">{name}</span>
    </div>
  );
}
