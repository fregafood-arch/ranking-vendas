"use client";

import { useTransition } from "react";
import { setFlashChallengeActive } from "@/lib/actions/flash-challenges.actions";

export function FlashChallengeActiveToggle({
  challengeId,
  isActive,
}: {
  challengeId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setFlashChallengeActive(challengeId, !isActive))}
      className="text-neutral-400 transition-colors hover:text-neutral-50 disabled:opacity-60"
    >
      {isActive ? "Encerrar agora" : "Reativar"}
    </button>
  );
}
