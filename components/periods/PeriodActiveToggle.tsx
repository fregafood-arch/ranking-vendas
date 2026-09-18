"use client";

import { useTransition } from "react";
import { setPeriodActive } from "@/lib/actions/periods.actions";

export function PeriodActiveToggle({
  periodId,
  isActive,
}: {
  periodId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setPeriodActive(periodId, !isActive))}
      className="text-neutral-400 transition-colors hover:text-neutral-50 disabled:opacity-60"
    >
      {isActive ? "Inativar" : "Ativar"}
    </button>
  );
}
