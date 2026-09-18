"use client";

import { useActionState } from "react";
import type { TeamFormState } from "@/lib/actions/teams.actions";

export function TeamForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: TeamFormState, formData: FormData) => Promise<TeamFormState>;
  defaultValues?: { name?: string };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm text-neutral-300">
          Nome da equipe
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500"
        />
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
