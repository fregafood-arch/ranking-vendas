"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { achievementFormSchema } from "@/lib/validations/achievement";

export type AchievementFormState = { error: string } | undefined;

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function readAchievementFields(formData: FormData) {
  // indicatorId, description e rollingWindowDays só existem no DOM em
  // alguns casos (campos condicionais no formulário); FormData.get()
  // devolve null quando ausentes, e o zod .optional() só aceita
  // undefined — por isso o "|| undefined" (mesma lição da ETAPA 4).
  return achievementFormSchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
    description: formData.get("description") || undefined,
    triggerType: formData.get("triggerType"),
    indicatorId: formData.get("indicatorId") || undefined,
    comparisonOperator: formData.get("comparisonOperator"),
    thresholdValue: formData.get("thresholdValue"),
    scope: formData.get("scope"),
    rollingWindowDays: formData.get("rollingWindowDays") || undefined,
  });
}

export async function createAchievement(
  _prevState: AchievementFormState,
  formData: FormData,
): Promise<AchievementFormState> {
  await requireAdmin();

  const parsed = readAchievementFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    name,
    icon,
    description,
    triggerType,
    indicatorId,
    comparisonOperator,
    thresholdValue,
    scope,
    rollingWindowDays,
  } = parsed.data;

  const { error } = await supabase.from("achievements").insert({
    code: `${slugify(name)}_${Date.now().toString(36).toUpperCase()}`,
    name,
    icon,
    description: description || null,
    trigger_type: triggerType,
    indicator_id: indicatorId || null,
    comparison_operator: comparisonOperator,
    threshold_value: Number(thresholdValue),
    scope,
    rolling_window_days: scope === "ROLLING_WINDOW" ? Number(rollingWindowDays) : null,
  });

  if (error) {
    return { error: `Não foi possível cadastrar a conquista: ${error.message}` };
  }

  revalidatePath("/admin/conquistas");
  redirect("/admin/conquistas");
}

export async function updateAchievement(
  achievementId: string,
  _prevState: AchievementFormState,
  formData: FormData,
): Promise<AchievementFormState> {
  await requireAdmin();

  const parsed = readAchievementFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    name,
    icon,
    description,
    triggerType,
    indicatorId,
    comparisonOperator,
    thresholdValue,
    scope,
    rollingWindowDays,
  } = parsed.data;

  const { error } = await supabase
    .from("achievements")
    .update({
      name,
      icon,
      description: description || null,
      trigger_type: triggerType,
      indicator_id: indicatorId || null,
      comparison_operator: comparisonOperator,
      threshold_value: Number(thresholdValue),
      scope,
      rolling_window_days: scope === "ROLLING_WINDOW" ? Number(rollingWindowDays) : null,
    })
    .eq("id", achievementId);

  if (error) {
    return { error: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath("/admin/conquistas");
  redirect("/admin/conquistas");
}

export async function setAchievementActive(achievementId: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("achievements")
    .update({ is_active: isActive })
    .eq("id", achievementId);

  if (error) {
    throw new Error(`Não foi possível atualizar o status: ${error.message}`);
  }

  revalidatePath("/admin/conquistas");
}
