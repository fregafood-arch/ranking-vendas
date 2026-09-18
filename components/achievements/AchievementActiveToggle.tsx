"use client";

import { useTransition } from "react";
import { setAchievementActive } from "@/lib/actions/achievements.actions";

export function AchievementActiveToggle({
  achievementId,
  isActive,
}: {
  achievementId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setAchievementActive(achievementId, !isActive))}
      className="text-neutral-400 transition-colors hover:text-neutral-50 disabled:opacity-60"
    >
      {isActive ? "Inativar" : "Ativar"}
    </button>
  );
}
