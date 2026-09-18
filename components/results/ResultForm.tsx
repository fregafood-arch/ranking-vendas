"use client";

import { useActionState } from "react";
import type { SalesResultFormState } from "@/lib/actions/sales-results.actions";

type Option = { id: string; label: string };

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500";
const labelClass = "text-sm text-neutral-300";

export function ResultForm({
  action,
  sellers,
  indicators,
  defaultValues,
  submitLabel,
}: {
  action: (state: SalesResultFormState, formData: FormData) => Promise<SalesResultFormState>;
  sellers: Option[];
  indicators: Option[];
  defaultValues?: {
    sellerId?: string;
    indicatorId?: string;
    value?: number;
    entryDate?: string;
    notes?: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div className="space-y-1">
        <label htmlFor="sellerId" className={labelClass}>
          Vendedor
        </label>
        <select
          id="sellerId"
          name="sellerId"
          required
          defaultValue={defaultValues?.sellerId ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Selecione
          </option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="indicatorId" className={labelClass}>
          Indicador
        </label>
        <select
          id="indicatorId"
          name="indicatorId"
          required
          defaultValue={defaultValues?.indicatorId ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Selecione
          </option>
          {indicators.map((indicator) => (
            <option key={indicator.id} value={indicator.id}>
              {indicator.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="value" className={labelClass}>
          Valor
        </label>
        <input
          id="value"
          name="value"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={defaultValues?.value}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="entryDate" className={labelClass}>
          Data
        </label>
        <input
          id="entryDate"
          name="entryDate"
          type="date"
          required
          defaultValue={defaultValues?.entryDate}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className={labelClass}>
          Observação (opcional)
        </label>
        <input
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
