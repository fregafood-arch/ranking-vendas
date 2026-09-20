"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";

/**
 * Botão de ação destrutiva com confirmação em modal (via portal pro
 * document.body): renderizar a confirmação inline na própria linha da
 * tabela força o texto para fora da largura da coluna, e como a tabela
 * usa overflow-x-auto pra rolar em telas estreitas, um popover absoluto
 * também seria cortado por esse mesmo contêiner (overflow-x diferente de
 * visible faz o eixo Y também cortar, não só o X). O portal escapa disso
 * de vez. Reaproveitado em toda tela com exclusão.
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

  function close() {
    if (isPending) return;
    setConfirming(false);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={className ?? "text-neutral-400 transition-colors hover:text-red-400"}
      >
        {label}
      </button>

      {confirming &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={close}
          >
            <div
              className="w-full max-w-sm rounded-lg border border-neutral-700 bg-neutral-900 p-5 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-sm text-neutral-200">{confirmQuestion}</p>
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
              <div className="mt-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={close}
                  className="text-sm text-neutral-400 transition-colors hover:text-neutral-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      setError(null);
                      try {
                        await onConfirm();
                        close();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Não foi possível concluir a ação.");
                      }
                    })
                  }
                  className="text-sm font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-60"
                >
                  {isPending ? "Excluindo..." : confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
