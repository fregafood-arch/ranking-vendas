"use client";

import { useActionState, useState } from "react";
import type { AchievementFormState } from "@/lib/actions/achievements.actions";
import {
  TRIGGER_TYPE_OPTIONS,
  COMPARISON_OPERATOR_OPTIONS,
  SCOPE_OPTIONS,
} from "@/lib/validations/achievement";
import { FormActions } from "@/components/shared/FormActions";

type Indicator = { id: string; name: string };

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500";
const labelClass = "text-sm text-neutral-300";

const INDICATOR_REQUIRED_TRIGGERS = new Set(["STREAK", "ABSOLUTE_VALUE"]);

export function AchievementForm({
  action,
  indicators,
  defaultValues,
  submitLabel,
}: {
  action: (state: AchievementFormState, formData: FormData) => Promise<AchievementFormState>;
  indicators: Indicator[];
  defaultValues?: {
    name?: string;
    icon?: string;
    description?: string | null;
    triggerType?: string;
    indicatorId?: string | null;
    comparisonOperator?: string;
    thresholdValue?: number;
    scope?: string;
    rollingWindowDays?: number | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [triggerType, setTriggerType] = useState(defaultValues?.triggerType ?? "GOAL_ATTAINMENT_PCT");
  const [scope, setScope] = useState(defaultValues?.scope ?? "PERIOD");

  const showIndicator = INDICATOR_REQUIRED_TRIGGERS.has(triggerType) || triggerType === "GOAL_ATTAINMENT_PCT";

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className="space-y-1">
          <label htmlFor="icon" className={labelClass}>
            Ícone
          </label>
          <input
            id="icon"
            name="icon"
            required
            defaultValue={defaultValues?.icon ?? "🏆"}
            className={`${inputClass} w-20 text-center text-lg`}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="name" className={labelClass}>
            Nome
          </label>
          <input id="name" name="name" required defaultValue={defaultValues?.name} className={inputClass} />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className={labelClass}>
          Descrição (opcional)
        </label>
        <input
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="triggerType" className={labelClass}>
          Gatilho
        </label>
        <select
          id="triggerType"
          name="triggerType"
          value={triggerType}
          onChange={(event) => setTriggerType(event.target.value)}
          className={inputClass}
        >
          {TRIGGER_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {showIndicator && (
        <div className="space-y-1">
          <label htmlFor="indicatorId" className={labelClass}>
            Indicador {INDICATOR_REQUIRED_TRIGGERS.has(triggerType) ? "" : "(opcional — vazio = meta principal/score geral)"}
          </label>
          <select
            id="indicatorId"
            name="indicatorId"
            defaultValue={defaultValues?.indicatorId ?? ""}
            required={INDICATOR_REQUIRED_TRIGGERS.has(triggerType)}
            className={inputClass}
          >
            <option value="">
              {INDICATOR_REQUIRED_TRIGGERS.has(triggerType) ? "Selecione" : "Meta principal / score geral"}
            </option>
            {indicators.map((indicator) => (
              <option key={indicator.id} value={indicator.id}>
                {indicator.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="comparisonOperator" className={labelClass}>
            Operador
          </label>
          <select
            id="comparisonOperator"
            name="comparisonOperator"
            defaultValue={defaultValues?.comparisonOperator ?? "GTE"}
            className={inputClass}
          >
            {COMPARISON_OPERATOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="thresholdValue" className={labelClass}>
            Valor de referência
          </label>
          <input
            id="thresholdValue"
            name="thresholdValue"
            type="number"
            step="0.01"
            required
            defaultValue={defaultValues?.thresholdValue}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="scope" className={labelClass}>
          Escopo
        </label>
        <select
          id="scope"
          name="scope"
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          className={inputClass}
        >
          {SCOPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {scope === "ROLLING_WINDOW" && (
        <div className="space-y-1">
          <label htmlFor="rollingWindowDays" className={labelClass}>
            Janela (dias)
          </label>
          <input
            id="rollingWindowDays"
            name="rollingWindowDays"
            type="number"
            min="1"
            required
            defaultValue={defaultValues?.rollingWindowDays ?? 30}
            className={inputClass}
          />
        </div>
      )}

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <FormActions submitLabel={submitLabel} pending={pending} cancelHref="/admin/conquistas" />
    </form>
  );
}
