"use client";

import { useState, useTransition } from "react";
import { saveTieBreakRules } from "@/lib/actions/ranking-config.actions";

const RULE_KEY_OPTIONS = [
  { value: "PRIMARY_GOAL_PERCENT", label: "% da meta principal" },
  { value: "GENERAL_SCORE", label: "Pontuação geral" },
  { value: "RAW_SALES_COUNT", label: "Número de vendas" },
  { value: "EARLIEST_ACHIEVEMENT", label: "Quem atingiu primeiro" },
];

type Rule = { ruleKey: string; direction: "ASC" | "DESC" };

export function TieBreakRulesForm({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    setRules((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSuccess(false);
  }

  function updateRule(index: number, patch: Partial<Rule>) {
    setRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
    setSuccess(false);
  }

  function handleSave() {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await saveTieBreakRules(
        rules.map((rule, index) => ({
          priority: index + 1,
          ruleKey: rule.ruleKey,
          direction: rule.direction,
        })),
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
          >
            <span className="w-6 text-sm font-semibold text-neutral-500">{index + 1}º</span>
            <select
              value={rule.ruleKey}
              onChange={(event) => updateRule(index, { ruleKey: event.target.value })}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500"
            >
              {RULE_KEY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={rule.direction}
              onChange={(event) =>
                updateRule(index, { direction: event.target.value as "ASC" | "DESC" })
              }
              className="w-40 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500"
            >
              <option value="DESC">Maior primeiro</option>
              <option value="ASC">Menor primeiro</option>
            </select>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="text-xs text-neutral-400 transition-colors hover:text-neutral-50 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rules.length - 1}
                className="text-xs text-neutral-400 transition-colors hover:text-neutral-50 disabled:opacity-30"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Ordem de desempate salva.</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Salvar ordem de desempate"}
      </button>
    </div>
  );
}
