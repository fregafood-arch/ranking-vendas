"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { salesResultFormSchema } from "@/lib/validations/sales-result";

export type SalesResultFormState = { error: string } | undefined;

function readResultFields(formData: FormData) {
  return salesResultFormSchema.safeParse({
    sellerId: formData.get("sellerId"),
    indicatorId: formData.get("indicatorId"),
    value: formData.get("value"),
    entryDate: formData.get("entryDate"),
    notes: formData.get("notes") || undefined,
  });
}

export async function createSalesResult(
  _prevState: SalesResultFormState,
  formData: FormData,
): Promise<SalesResultFormState> {
  const profile = await requireAdmin();

  const parsed = readResultFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { sellerId, indicatorId, value, entryDate, notes } = parsed.data;

  const { error } = await supabase.from("sales_results").insert({
    seller_id: sellerId,
    indicator_id: indicatorId,
    value: Number(value),
    entry_date: entryDate,
    notes: notes || null,
    recorded_by: profile.id,
  });

  if (error) {
    return { error: `Não foi possível lançar o resultado: ${error.message}` };
  }

  await evaluateAchievementsForActivePeriods(supabase);

  revalidatePath("/admin/resultados");
  redirect("/admin/resultados");
}

/**
 * Reavalia conquistas (ETAPA 8) logo após um lançamento, para os períodos
 * marcados como ativos — não necessariamente o período ao qual entry_date
 * pertence, o que é uma simplificação deliberada: cobre o caso comum (o
 * lançamento é para o período corrente) sem precisar descobrir todos os
 * períodos cujo intervalo de datas contém entry_date. Um lançamento
 * retroativo para um período já encerrado não recalcula as conquistas
 * daquele período antigo.
 *
 * Best-effort: um erro aqui não deve impedir o lançamento em si (que já
 * foi gravado com sucesso), então falhas são ignoradas silenciosamente.
 */
async function evaluateAchievementsForActivePeriods(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const { data: activePeriods } = await supabase.from("periods").select("id").eq("is_active", true);

  for (const period of activePeriods ?? []) {
    await supabase.rpc("evaluate_achievements", { p_period_id: period.id }).then(
      () => undefined,
      () => undefined,
    );
  }
}

export async function updateSalesResult(
  resultId: string,
  _prevState: SalesResultFormState,
  formData: FormData,
): Promise<SalesResultFormState> {
  await requireAdmin();

  const parsed = readResultFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { sellerId, indicatorId, value, entryDate, notes } = parsed.data;

  const { error } = await supabase
    .from("sales_results")
    .update({
      seller_id: sellerId,
      indicator_id: indicatorId,
      value: Number(value),
      entry_date: entryDate,
      notes: notes || null,
    })
    .eq("id", resultId);

  if (error) {
    return { error: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath("/admin/resultados");
  redirect("/admin/resultados");
}

export async function deleteSalesResult(resultId: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("sales_results").delete().eq("id", resultId);

  if (error) {
    throw new Error(`Não foi possível excluir: ${error.message}`);
  }

  revalidatePath("/admin/resultados");
}
