"use client";

import { useState, useTransition } from "react";
import { quickAdjustSalesResult } from "@/lib/actions/sales-results.actions";
import { SellerAvatar } from "@/components/sellers/SellerAvatar";

export function QuickResultRow({
  rank,
  sellerId,
  name,
  photoPath,
  resultLabel,
  indicatorId,
  indicatorName,
}: {
  rank: number;
  sellerId: string;
  name: string;
  photoPath: string | null;
  resultLabel: string;
  indicatorId: string | null;
  indicatorName: string | null;
}) {
  const [addValue, setAddValue] = useState("");
  const [removeValue, setRemoveValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(direction: "add" | "remove") {
    if (!indicatorId) return;
    const raw = direction === "add" ? addValue : removeValue;
    const amount = Number(raw.replace(",", "."));

    if (!raw || Number.isNaN(amount) || amount <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await quickAdjustSalesResult({ sellerId, indicatorId, amount, direction });
        if (direction === "add") setAddValue("");
        else setRemoveValue("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível lançar.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-neutral-800/60">
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-neutral-500">{rank}º</span>
      <SellerAvatar photoPath={photoPath} name={name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-100">{name}</p>
        <p className="truncate text-xs text-neutral-500">
          {indicatorName ?? "Sem meta"} · {resultLabel}
        </p>
      </div>

      {indicatorId && (
        <div className="flex shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={addValue}
              onChange={(event) => setAddValue(event.target.value)}
              placeholder="Adicionar"
              disabled={isPending}
              className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit("add")}
              className="rounded-lg bg-emerald-600 px-2 py-1 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={removeValue}
              onChange={(event) => setRemoveValue(event.target.value)}
              placeholder="Retirar"
              disabled={isPending}
              className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-red-500 focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit("remove")}
              className="rounded-lg bg-red-600/80 px-2 py-1 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
            >
              −
            </button>
          </div>
        </div>
      )}

      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </div>
  );
}
