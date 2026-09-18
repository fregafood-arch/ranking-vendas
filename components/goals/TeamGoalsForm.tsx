"use client";

import { useState, useTransition } from "react";
import { upsertTeamGoal } from "@/lib/actions/team-goals.actions";

type Indicator = { id: string; name: string; unit: string };

export function TeamGoalsForm({
  periodId,
  indicators,
  initialValues,
}: {
  periodId: string;
  indicators: Indicator[];
  initialValues: Record<string, number>;
}) {
  const [values, setValues] = useState<Record<string, number>>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      for (const indicator of indicators) {
        const value = values[indicator.id];
        if (!value || value <= 0) continue;

        const result = await upsertTeamGoal(periodId, indicator.id, value);
        if (result.error) {
          setError(`${indicator.name}: ${result.error}`);
          return;
        }
      }
      setSuccess(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {indicators.map((indicator) => (
          <div key={indicator.id} className="space-y-1">
            <label className="text-sm text-neutral-300">
              {indicator.name} <span className="text-neutral-500">({indicator.unit})</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values[indicator.id] ?? ""}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, [indicator.id]: Number(event.target.value) }))
              }
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Metas da equipe salvas.</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Salvar metas da equipe"}
      </button>
    </div>
  );
}
