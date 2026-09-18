"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

export type RankingRuleInput = {
  indicatorId: string;
  defaultWeight: number;
  attainmentCap: number | null;
};

/**
 * Mesma regra de "pesos somam 100%" que seller_goals (ver 0002/0005) — o
 * conjunto inteiro precisa ser gravado numa única transação, por isso a
 * RPC upsert_ranking_rules (0008) em vez de updates linha a linha.
 */
export async function saveRankingRules(
  periodId: string,
  rules: RankingRuleInput[],
): Promise<{ error?: string }> {
  await requireAdmin();

  const totalWeight = rules.reduce((sum, rule) => sum + rule.defaultWeight, 0);
  if (rules.length > 0 && Math.abs(totalWeight - 100) > 0.01) {
    return { error: `Os pesos somam ${totalWeight.toFixed(2)}%, mas devem somar 100%.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_ranking_rules", {
    p_period_id: periodId,
    p_rules: rules.map((rule) => ({
      indicator_id: rule.indicatorId,
      default_weight: rule.defaultWeight,
      attainment_cap: rule.attainmentCap,
    })),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/configuracoes");
  return {};
}

export type TieBreakRuleInput = {
  priority: number;
  ruleKey: string;
  direction: "ASC" | "DESC";
};

export async function saveTieBreakRules(rules: TieBreakRuleInput[]): Promise<{ error?: string }> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_tie_break_rules", {
    p_ranking_scope: "GENERAL",
    p_rules: rules.map((rule) => ({
      priority: rule.priority,
      rule_key: rule.ruleKey,
      direction: rule.direction,
    })),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/configuracoes");
  return {};
}
