"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveSellerGoals, type SellerGoalInput } from "@/lib/actions/seller-goals.actions";

type Indicator = { id: string; name: string; unit: string };

type Row = {
  indicatorId: string;
  name: string;
  unit: string;
  targetValue: number;
  weight: number;
  enabled: boolean;
};

export function SellerGoalsForm({
  sellerId,
  periodId,
  indicators,
  initialGoals,
}: {
  sellerId: string;
  periodId: string;
  indicators: Indicator[];
  initialGoals: Record<string, { targetValue: number; weight: number }>;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    indicators.map((indicator) => ({
      indicatorId: indicator.id,
      name: indicator.name,
      unit: indicator.unit,
      targetValue: initialGoals[indicator.id]?.targetValue ?? 0,
      weight: initialGoals[indicator.id]?.weight ?? 0,
      enabled: Boolean(initialGoals[indicator.id]),
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalWeight = rows
    .filter((row) => row.enabled)
    .reduce((sum, row) => sum + (Number(row.weight) || 0), 0);
  const weightIsBalanced = totalWeight === 0 || Math.abs(totalWeight - 100) < 0.01;

  function updateRow(indicatorId: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((row) => (row.indicatorId === indicatorId ? { ...row, ...patch } : row)),
    );
    setSuccess(false);
  }

  function handleSave() {
    setError(null);
    setSuccess(false);

    const goals: SellerGoalInput[] = rows
      .filter((row) => row.enabled)
      .map((row) => ({
        indicatorId: row.indicatorId,
        targetValue: Number(row.targetValue),
        weight: Number(row.weight),
      }));

    for (const goal of goals) {
      if (!(goal.targetValue > 0)) {
        setError("Toda meta ativa precisa de um valor maior que zero.");
        return;
      }
    }

    startTransition(async () => {
      const result = await saveSellerGoals(sellerId, periodId, goals);
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
              <th className="px-4 py-3 font-medium" aria-hidden />
              <th className="px-4 py-3 font-medium">Indicador</th>
              <th className="px-4 py-3 font-medium">Meta</th>
              <th className="px-4 py-3 font-medium">Peso (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.map((row) => (
              <tr key={row.indicatorId} className="text-neutral-200">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(event) => updateRow(row.indicatorId, { enabled: event.target.checked })}
                  />
                </td>
                <td className="px-4 py-3">
                  {row.name} <span className="text-neutral-500">({row.unit})</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!row.enabled}
                    value={row.targetValue}
                    onChange={(event) =>
                      updateRow(row.indicatorId, { targetValue: Number(event.target.value) })
                    }
                    className="w-28 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-50 outline-none focus:border-neutral-500 disabled:opacity-50"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={!row.enabled}
                    value={row.weight}
                    onChange={(event) =>
                      updateRow(row.indicatorId, { weight: Number(event.target.value) })
                    }
                    className="w-24 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-50 outline-none focus:border-neutral-500 disabled:opacity-50"
                  />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  Nenhum indicador ativo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={weightIsBalanced ? "text-sm text-neutral-400" : "text-sm text-amber-400"}>
        Soma dos pesos ativos: {totalWeight.toFixed(2)}%
        {!weightIsBalanced && " — precisa somar 100% para salvar."}
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Metas salvas.</p>}

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Salvar metas"}
        </button>
        <Link
          href={`/admin/metas?period=${periodId}`}
          className="text-sm text-neutral-400 transition-colors hover:text-neutral-100"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
