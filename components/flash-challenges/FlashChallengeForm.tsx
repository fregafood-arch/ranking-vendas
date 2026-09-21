"use client";

import { useActionState, useEffect, useRef } from "react";
import { createFlashChallenge } from "@/lib/actions/flash-challenges.actions";

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500";
const labelClass = "text-sm text-neutral-300";

export function FlashChallengeForm() {
  const [state, formAction, pending] = useActionState(createFlashChallenge, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="title" className={labelClass}>
          Título
        </label>
        <input id="title" name="title" required placeholder="Sprint da tarde" className={inputClass} />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className={labelClass}>
          Descrição (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Quem vender mais até o fim do prazo leva o prêmio."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="prizeLabel" className={labelClass}>
            Prêmio
          </label>
          <input id="prizeLabel" name="prizeLabel" required placeholder="Vale-presente R$100" className={inputClass} />
        </div>

        <div className="space-y-1">
          <label htmlFor="endsAt" className={labelClass}>
            Termina em
          </label>
          <input id="endsAt" name="endsAt" type="datetime-local" required className={inputClass} />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar desafio relâmpago"}
      </button>
    </form>
  );
}
