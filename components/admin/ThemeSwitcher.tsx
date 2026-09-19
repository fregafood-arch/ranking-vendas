"use client";

import { useState, useTransition } from "react";
import { setActiveTheme } from "@/lib/actions/theme.actions";
import { THEME_OPTIONS, type AppTheme } from "@/lib/theme-types";

export function ThemeSwitcher({ current }: { current: AppTheme }) {
  const [selected, setSelected] = useState<AppTheme>(current);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(theme: AppTheme) {
    if (theme === selected) return;
    setSelected(theme);
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await setActiveTheme(theme);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isPending}
            onClick={() => handleSelect(option.value)}
            className={
              selected === option.value
                ? "rounded-2xl bg-neutral-800 p-4 text-left ring-2 ring-emerald-500 disabled:opacity-60"
                : "rounded-2xl bg-neutral-900 p-4 text-left transition-colors hover:bg-neutral-800 disabled:opacity-60"
            }
          >
            <p className="font-semibold text-neutral-50">{option.label}</p>
            <p className="mt-1 text-sm text-neutral-400">{option.description}</p>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-400">
          Skin aplicada — vale para Ranking, Pódio e Modo TV de todo mundo.
        </p>
      )}
    </div>
  );
}
