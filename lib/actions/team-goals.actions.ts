"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

/**
 * team_id nulo = meta "da empresa toda" (não amarrada a uma equipe
 * específica); um uuid = meta daquela equipe (tabela teams). O índice único
 * parcial em team_id is null (0001_schema.sql) não é alcançável pelo
 * .upsert()/onConflict do PostgREST, que não expõe a cláusula WHERE de um
 * índice parcial — por isso aqui é select-então-update-ou-insert, simples
 * e suficiente para o volume de escrita desta tela (poucos indicadores,
 * só ADMIN).
 *
 * Meta de equipe é opcional (não é erro deixar em branco): um targetValue
 * zerado/vazio apaga a meta existente em vez de rejeitar a gravação.
 */
export async function upsertTeamGoal(
  periodId: string,
  teamId: string | null,
  indicatorId: string,
  targetValue: number,
): Promise<{ error?: string }> {
  await requireAdmin();

  const supabase = await createClient();

  if (!(targetValue > 0)) {
    const query = supabase.from("team_goals").delete().eq("period_id", periodId).eq("indicator_id", indicatorId);
    const { error } = teamId ? await query.eq("team_id", teamId) : await query.is("team_id", null);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin/metas");
    revalidatePath("/dashboard");
    return {};
  }

  const selectQuery = supabase
    .from("team_goals")
    .select("id")
    .eq("period_id", periodId)
    .eq("indicator_id", indicatorId);
  const { data: existing } = await (teamId
    ? selectQuery.eq("team_id", teamId)
    : selectQuery.is("team_id", null)
  ).maybeSingle();

  const { error } = existing
    ? await supabase.from("team_goals").update({ target_value: targetValue }).eq("id", existing.id)
    : await supabase.from("team_goals").insert({
        team_id: teamId,
        period_id: periodId,
        indicator_id: indicatorId,
        target_value: targetValue,
      });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/metas");
  revalidatePath("/dashboard");
  return {};
}
