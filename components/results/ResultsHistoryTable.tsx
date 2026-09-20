"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmButton } from "@/components/shared/ConfirmButton";
import { deleteSalesResult, deleteSalesResults } from "@/lib/actions/sales-results.actions";

export type ResultRow = {
  id: string;
  sellerName: string;
  indicatorLabel: string;
  valueLabel: string;
  dateLabel: string;
};

export function ResultsHistoryTable({ rows }: { rows: ResultRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)));
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5">
          <p className="text-sm text-neutral-300">{selected.size} selecionado(s)</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Limpar seleção
            </button>
            <ConfirmButton
              label="Excluir selecionados"
              confirmLabel="Excluir"
              confirmQuestion={`Excluir ${selected.size} lançamento(s) selecionado(s)? Essa ação não pode ser desfeita.`}
              onConfirm={async () => {
                await deleteSalesResults([...selected]);
                setSelected(new Set());
              }}
              className="text-sm font-medium text-red-400 transition-colors hover:text-red-300"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todos os lançamentos"
                  className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-blue-600"
                />
              </th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Indicador</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.map((row) => (
              <tr
                key={row.id}
                className={
                  selected.has(row.id) ? "bg-neutral-900/70 text-neutral-200" : "text-neutral-200"
                }
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    aria-label={`Selecionar lançamento de ${row.sellerName}`}
                    className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-blue-600"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{row.sellerName}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-400">{row.indicatorLabel}</td>
                <td className="px-4 py-3 whitespace-nowrap">{row.valueLabel}</td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-400">{row.dateLabel}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link
                      href={`/admin/resultados/${row.id}`}
                      className="text-neutral-400 transition-colors hover:text-neutral-50"
                    >
                      Editar
                    </Link>
                    <ConfirmButton
                      label="Excluir"
                      confirmLabel="Excluir"
                      onConfirm={() => deleteSalesResult(row.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  Nenhum lançamento ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
