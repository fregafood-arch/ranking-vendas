"use client";

import { useActionState } from "react";
import type { PeriodFormState } from "@/lib/actions/periods.actions";
import { PERIOD_TYPE_OPTIONS } from "@/lib/validations/period";

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
