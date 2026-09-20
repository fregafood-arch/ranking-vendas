"use client";

import { useState, useTransition } from "react";

/**
 * Botão de ação destrutiva com confirmação inline (sem modal): o primeiro
 * clique troca o botão por "Tem certeza? Excluir / Cancelar". Reaproveitado
 * em toda tela com exclusão (lançamentos hoje; outras entidades depois).
 */
export function ConfirmButton({
  label,
  confirmLabel = "Confirmar",
  confirmQuestion = "Tem certeza?",
  onConfirm,
  className,
}: {
  label: string;
  confirmLabel?: string;
  confirmQuestion?: string;
  onConfirm: () => Promise<void> | void;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs text-neutral-500">{confirmQuestion}</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                try {
                  await onConfirm();
                  setConfirming(false);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Não foi possível concluir a ação.");
                }
              })
            }
            className="text-xs font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-60"
          >
            {isPending ? "Excluindo..." : confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
          >
            Cancelar
          </button>
        </span>
        {error && <span className="max-w-xs text-right text-xs text-red-400">{error}</span>}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={className ?? "text-neutral-400 transition-colors hover:text-red-400"}
    >
      {label}
    </button>
  );
}
