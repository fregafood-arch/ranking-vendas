"use client";

import { useActionState } from "react";
import type { PeriodFormState } from "@/lib/actions/periods.actions";
import { PERIOD_TYPE_OPTIONS } from "@/lib/validations/period";
import { FormActions } from "@/components/shared/FormActions";

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500";
const labelClass = "text-sm text-neutral-300";

export function PeriodForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: PeriodFormState, formData: FormData) => Promise<PeriodFormState>;
  defaultValues?: {
    type?: string;
    label?: string;
    startDate?: string;
    endDate?: string;
    tvHidePodium?: boolean;
    tvHideStats?: boolean;
    tvHideRankingList?: boolean;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div className="space-y-1">
        <label htmlFor="type" className={labelClass}>
          Tipo
        </label>
        <select
          id="type"
          name="type"
          defaultValue={defaultValues?.type ?? "MONTHLY"}
          className={inputClass}
        >
          {PERIOD_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="label" className={labelClass}>
          Rótulo
        </label>
        <input
          id="label"
          name="label"
          required
          placeholder="Setembro/2026"
          defaultValue={defaultValues?.label}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="startDate" className={labelClass}>
            Data inicial
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={defaultValues?.startDate}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="endDate" className={labelClass}>
            Data final
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={defaultValues?.endDate}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-neutral-800 p-4">
        <p className={labelClass}>Modo TV — o que este período mostra</p>
        <p className="text-xs text-neutral-500">
          Desmarque pra tirar de rodízio, sem afetar os outros períodos.
        </p>
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="tvHidePodium"
              defaultChecked={defaultValues?.tvHidePodium}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
            />
            Ocultar pódio
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="tvHideStats"
              defaultChecked={defaultValues?.tvHideStats}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
            />
            Ocultar metas/estatísticas
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              name="tvHideRankingList"
              defaultChecked={defaultValues?.tvHideRankingList}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
            />
            Ocultar lista completa do ranking
          </label>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <FormActions submitLabel={submitLabel} pending={pending} cancelHref="/admin/periodos" />
    </form>
  );
}
