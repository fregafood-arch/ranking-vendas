"use client";

import { useActionState } from "react";
import type { SellerFormState } from "@/lib/actions/sellers.actions";
import { FormActions } from "@/components/shared/FormActions";

type Team = { id: string; name: string };

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-500";
const labelClass = "text-sm text-neutral-300";

export function SellerForm({
  action,
  teams,
  defaultValues,
  submitLabel,
}: {
  action: (state: SellerFormState, formData: FormData) => Promise<SellerFormState>;
  teams: Team[];
  defaultValues?: {
    fullName?: string;
    roleTitle?: string | null;
    teamId?: string | null;
    startDate?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div className="space-y-1">
        <label htmlFor="fullName" className={labelClass}>
          Nome
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          defaultValue={defaultValues?.fullName}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="roleTitle" className={labelClass}>
          Cargo ou função
        </label>
        <input
          id="roleTitle"
          name="roleTitle"
          defaultValue={defaultValues?.roleTitle ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="teamId" className={labelClass}>
          Equipe
        </label>
        <select
          id="teamId"
          name="teamId"
          defaultValue={defaultValues?.teamId ?? ""}
          className={inputClass}
        >
          <option value="">Sem equipe</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="startDate" className={labelClass}>
          Data de entrada
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
        <label htmlFor="photo" className={labelClass}>
          Foto
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="w-full text-sm text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-sm file:text-neutral-100 hover:file:bg-neutral-700"
        />
        <p className="text-xs text-neutral-500">PNG, JPEG ou WEBP, até 5 MB.</p>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <FormActions submitLabel={submitLabel} pending={pending} cancelHref="/admin/vendedores" />
    </form>
  );
}
