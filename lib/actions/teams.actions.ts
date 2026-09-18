"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { teamFormSchema } from "@/lib/validations/team";

export type TeamFormState = { error: string } | undefined;

function friendlyError(message: string, code?: string) {
  if (code === "23505") return "Já existe uma equipe com esse nome.";
  return message;
}

export async function createTeam(
  _prevState: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  await requireAdmin();

  const parsed = teamFormSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teams").insert({ name: parsed.data.name });

  if (error) {
    return { error: `Não foi possível criar a equipe: ${friendlyError(error.message, error.code)}` };
  }

  revalidatePath("/admin/equipes");
  redirect("/admin/equipes");
}

export async function updateTeam(
  teamId: string,
  _prevState: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  await requireAdmin();

  const parsed = teamFormSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({ name: parsed.data.name })
    .eq("id", teamId);

  if (error) {
    return { error: `Não foi possível salvar: ${friendlyError(error.message, error.code)}` };
  }

  revalidatePath("/admin/equipes");
  redirect("/admin/equipes");
}

export async function setTeamActive(teamId: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("teams").update({ is_active: isActive }).eq("id", teamId);

  if (error) {
    throw new Error(`Não foi possível atualizar o status: ${error.message}`);
  }

  revalidatePath("/admin/equipes");
}
