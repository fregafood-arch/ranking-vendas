"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAnnouncement } from "@/lib/actions/announcements.actions";

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500";
const labelClass = "text-sm text-neutral-300";

export function AnnouncementForm() {
  const [state, formAction, pending] = useActionState(createAnnouncement, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    // Formulário fica na mesma tela (sem redirect, ao contrário de outras
    // telas de admin) -- limpa os campos sozinho assim que um envio termina
    // sem erro, pra dar espaço pro próximo aviso sem o usuário apagar à mão.
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="title" className={labelClass}>
          Título (opcional)
        </label>
        <input id="title" name="title" className={inputClass} />
      </div>

      <div className="space-y-1">
        <label htmlFor="body" className={labelClass}>
          Aviso
        </label>
        <textarea id="body" name="body" required rows={3} className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
      >
        {pending ? "Publicando..." : "Publicar aviso"}
      </button>
    </form>
  );
}
