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
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filteredRows = query
    ? rows.filter((row) =>
        [row.sellerName, row.indicatorLabel, row.valueLabel, row.dateLabel]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : rows;

  const allSelected = filteredRows.length > 0 && filteredRows.every((row) => selected.has(row.id));

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
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const row of filteredRows) next.delete(row.id);
      } else {
        for (const row of filteredRows) next.add(row.id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por vendedor, indicador, valor ou data..."
        className="w-full max-w-sm rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
      />

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
            {filteredRows.map((row) => (
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
            {!filteredRows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  {rows.length ? "Nenhum lançamento encontrado para essa busca." : "Nenhum lançamento ainda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
