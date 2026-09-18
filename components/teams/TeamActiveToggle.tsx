"use client";

import { useTransition } from "react";
import { setTeamActive } from "@/lib/actions/teams.actions";

export function TeamActiveToggle({ teamId, isActive }: { teamId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setTeamActive(teamId, !isActive))}
      className="text-neutral-400 transition-colors hover:text-neutral-50 disabled:opacity-60"
    >
      {isActive ? "Inativar" : "Ativar"}
    </button>
  );
}
