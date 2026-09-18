"use client";

import { useActionState, useState } from "react";
import type { IndicatorFormState } from "@/lib/actions/indicators.actions";
import { UNIT_OPTIONS } from "@/lib/validations/indicator";

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500";
const labelClass = "text-sm text-neutral-300";

export function IndicatorForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: IndicatorFormState, formData: FormData) => Promise<IndicatorFormState>;
  defaultValues?: { name?: string; unit?: string; customUnitLabel?: string | null };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [unit, setUnit] = useState(defaultValues?.unit ?? "BRL");

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div className="space-y-1">
        <label htmlFor="name" className={labelClass}>
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="unit" className={labelClass}>
          Unidade
        </label>
        <select
          id="unit"
          name="unit"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          className={inputClass}
        >
          {UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {unit === "CUSTOM" && (
        <div className="space-y-1">
          <label htmlFor="customUnitLabel" className={labelClass}>
            Nome da unidade personalizada
          </label>
          <input
            id="customUnitLabel"
            name="customUnitLabel"
            defaultValue={defaultValues?.customUnitLabel ?? ""}
            className={inputClass}
          />
        </div>
      )}

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
