"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { indicatorFormSchema } from "@/lib/validations/indicator";

export type IndicatorFormState = { error: string } | undefined;

function readIndicatorFields(formData: FormData) {
  // O campo customUnitLabel só existe no DOM quando unit === "CUSTOM" (ver
  // IndicatorForm); nos demais casos FormData.get() devolve null, que o
  // zod NÃO trata como "ausente" da mesma forma que undefined — daí o
  // "|| undefined" abaixo.
  return indicatorFormSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    customUnitLabel: formData.get("customUnitLabel") || undefined,
  });
}

function friendlyError(message: string, code?: string) {
  if (code === "23505") return "Já existe um indicador com esse nome.";
  return message;
}

export async function createIndicator(
  _prevState: IndicatorFormState,
  formData: FormData,
): Promise<IndicatorFormState> {
  await requireAdmin();

  const parsed = readIndicatorFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { name, unit, customUnitLabel } = parsed.data;

  const { error } = await supabase.from("indicators").insert({
    name,
    unit,
    custom_unit_label: unit === "CUSTOM" ? customUnitLabel : null,
  });

  if (error) {
    return { error: `Não foi possível cadastrar o indicador: ${friendlyError(error.message, error.code)}` };
  }

  revalidatePath("/admin/indicadores");
  redirect("/admin/indicadores");
}

export async function updateIndicator(
  indicatorId: string,
  _prevState: IndicatorFormState,
  formData: FormData,
): Promise<IndicatorFormState> {
  await requireAdmin();

  const parsed = readIndicatorFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { name, unit, customUnitLabel } = parsed.data;

  const { error } = await supabase
    .from("indicators")
    .update({
      name,
      unit,
      custom_unit_label: unit === "CUSTOM" ? customUnitLabel : null,
    })
    .eq("id", indicatorId);

  if (error) {
    return { error: `Não foi possível salvar: ${friendlyError(error.message, error.code)}` };
  }

  revalidatePath("/admin/indicadores");
  redirect("/admin/indicadores");
}

export async function setIndicatorActive(indicatorId: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("indicators")
    .update({ is_active: isActive })
    .eq("id", indicatorId);

  if (error) {
    throw new Error(`Não foi possível atualizar o status: ${error.message}`);
  }

  revalidatePath("/admin/indicadores");
}

/**
 * Exclusão de verdade (não só inativar) — a pedido do usuário. As chaves
 * estrangeiras de seller_goals, team_goals, sales_results, ranking_rules e
 * achievements apontam pra indicators com "on delete cascade" (migration
 * 0001), então isso também apaga metas, lançamentos e regras de ranking já
 * feitos com este indicador. O aviso disso fica no texto de confirmação
 * (ver IndicatorDeleteButton), não só neste comentário.
 */
export async function deleteIndicator(indicatorId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("indicators").delete().eq("id", indicatorId);

  if (error) {
    throw new Error(`Não foi possível excluir: ${error.message}`);
  }

  revalidatePath("/admin/indicadores");
}
