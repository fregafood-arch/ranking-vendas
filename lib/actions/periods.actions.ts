"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { periodFormSchema } from "@/lib/validations/period";

export type PeriodFormState = { error: string } | undefined;

function readPeriodFields(formData: FormData) {
  return periodFormSchema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
}

function friendlyError(message: string, code?: string) {
  if (code === "23505") return "Já existe um período idêntico (mesmo tipo e datas).";
  return message;
}

export async function createPeriod(
  _prevState: PeriodFormState,
  formData: FormData,
): Promise<PeriodFormState> {
  await requireAdmin();

  const parsed = readPeriodFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { type, label, startDate, endDate } = parsed.data;

  const { error } = await supabase.from("periods").insert({
    type,
    label,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    return { error: `Não foi possível criar o período: ${friendlyError(error.message, error.code)}` };
  }

  revalidatePath("/admin/periodos");
  redirect("/admin/periodos");
}

export async function updatePeriod(
  periodId: string,
  _prevState: PeriodFormState,
  formData: FormData,
): Promise<PeriodFormState> {
  await requireAdmin();

  const parsed = readPeriodFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { type, label, startDate, endDate } = parsed.data;

  const { error } = await supabase
    .from("periods")
    .update({ type, label, start_date: startDate, end_date: endDate })
    .eq("id", periodId);

  if (error) {
    return { error: `Não foi possível salvar: ${friendlyError(error.message, error.code)}` };
  }

  revalidatePath("/admin/periodos");
  redirect("/admin/periodos");
}

export async function setPeriodActive(periodId: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("periods")
    .update({ is_active: isActive })
    .eq("id", periodId);

  if (error) {
    throw new Error(`Não foi possível atualizar o status: ${error.message}`);
  }

  revalidatePath("/admin/periodos");
}
