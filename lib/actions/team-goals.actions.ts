"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

/**
 * team_goals.team_id é nulo para a meta "da empresa toda" (única forma
 * usada hoje — não há tela de gestão de equipes ainda). O índice único
 * parcial em team_id is null (0001_schema.sql) não é alcançável pelo
 * .upsert()/onConflict do PostgREST, que não expõe a cláusula WHERE de um
 * índice parcial — por isso aqui é select-então-update-ou-insert, simples
 * e suficiente para o volume de escrita desta tela (poucos indicadores,
 * só ADMIN).
 */
export async function upsertTeamGoal(
  periodId: string,
  indicatorId: string,
  targetValue: number,
): Promise<{ error?: string }> {
  await requireAdmin();

  if (!(targetValue > 0)) {
    return { error: "A meta deve ser maior que zero." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("team_goals")
    .select("id")
    .is("team_id", null)
    .eq("period_id", periodId)
    .eq("indicator_id", indicatorId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("team_goals").update({ target_value: targetValue }).eq("id", existing.id)
    : await supabase.from("team_goals").insert({
        team_id: null,
        period_id: periodId,
        indicator_id: indicatorId,
        target_value: targetValue,
      });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/metas");
  return {};
}
