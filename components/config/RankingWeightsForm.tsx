"use client";

import { useState, useTransition } from "react";
import { saveRankingRules, type RankingRuleInput } from "@/lib/actions/ranking-config.actions";

type Indicator = { id: string; name: string };

type Row = {
  indicatorId: string;
  name: string;
  defaultWeight: number;
  attainmentCap: number | null;
};

export function RankingWeightsForm({
  periodId,
  indicators,
  initialRules,
}: {
  periodId: string;
  indicators: Indicator[];
  initialRules: Record<string, { defaultWeight: number; attainmentCap: number | null }>;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    indicators.map((indicator) => ({
      indicatorId: indicator.id,
      name: indicator.name,
      defaultWeight: initialRules[indicator.id]?.defaultWeight ?? 0,
      attainmentCap: initialRules[indicator.id]?.attainmentCap ?? 200,
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalWeight = rows.reduce((sum, row) => sum + (Number(row.defaultWeight) || 0), 0);
  const weightIsBalanced = totalWeight === 0 || Math.abs(totalWeight - 100) < 0.01;

  function updateRow(indicatorId: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.indicatorId === indicatorId ? { ...row, ...patch } : row)));
    setSuccess(false);
  }

  function handleSave() {
    setError(null);
    setSuccess(false);

    const rules: RankingRuleInput[] = rows.map((row) => ({
      indicatorId: row.indicatorId,
      defaultWeight: Number(row.defaultWeight),
      attainmentCap: row.attainmentCap === null ? null : Number(row.attainmentCap),
    }));

    startTransition(async () => {
      const result = await saveRankingRules(periodId, rules);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Indicador</th>
              <th className="px-4 py-3 font-medium">Peso padrão (%)</th>
              <th className="px-4 py-3 font-medium">Cap de atingimento (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.map((row) => (
              <tr key={row.indicatorId} className="text-neutral-200">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={row.defaultWeight}
                    onChange={(event) =>
                      updateRow(row.indicatorId, { defaultWeight: Number(event.target.value) })
                    }
                    className="w-24 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-50 outline-none focus:border-neutral-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={row.attainmentCap ?? ""}
                    placeholder="Sem teto"
                    onChange={(event) =>
                      updateRow(row.indicatorId, {
                        attainmentCap: event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                    className="w-28 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-50 outline-none focus:border-neutral-500"
                  />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                  Nenhum indicador ativo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={weightIsBalanced ? "text-sm text-neutral-400" : "text-sm text-amber-400"}>
        Soma dos pesos: {totalWeight.toFixed(2)}%
        {!weightIsBalanced && " — precisa somar 100% para salvar."}
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Configurações salvas.</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Salvar pesos e cap"}
      </button>
    </div>
  );
}
