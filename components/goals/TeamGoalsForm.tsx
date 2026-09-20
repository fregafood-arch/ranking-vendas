"use client";

import { useState, useTransition } from "react";
import { upsertTeamGoal } from "@/lib/actions/team-goals.actions";

type Indicator = { id: string; name: string; unit: string };

export function TeamGoalsForm({
  periodId,
  teamId,
  indicators,
  initialValues,
}: {
  periodId: string;
  teamId: string | null;
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
        // Sempre chama, mesmo com valor vazio/zero: a meta é opcional, então
        // limpar o campo precisa apagar uma meta já existente, não só
        // "pular" o indicador (que deixaria a meta antiga intacta).
        const value = values[indicator.id] || 0;
        const result = await upsertTeamGoal(periodId, teamId, indicator.id, value);
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
              placeholder="Sem meta definida"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Metas salvas.</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Salvar metas"}
      </button>
    </div>
  );
}
