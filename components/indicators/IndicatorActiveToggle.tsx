"use client";

import { useTransition } from "react";
import { setIndicatorActive } from "@/lib/actions/indicators.actions";

export function IndicatorActiveToggle({
  indicatorId,
  isActive,
}: {
  indicatorId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setIndicatorActive(indicatorId, !isActive))}
      className="text-neutral-400 transition-colors hover:text-neutral-50 disabled:opacity-60"
    >
      {isActive ? "Inativar" : "Ativar"}
    </button>
  );
}
