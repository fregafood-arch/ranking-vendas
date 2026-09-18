"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

export type SellerGoalInput = {
  indicatorId: string;
  targetValue: number;
  weight: number;
};

/**
 * Grava o conjunto inteiro de metas do vendedor para o período numa única
 * chamada RPC (upsert_seller_goals, 0005_seller_goals_upsert.sql) — precisa
 * ser assim porque a regra "pesos somam 100%" só é validada corretamente
 * se todas as linhas forem escritas na mesma transação (ver comentário na
 * migration).
 */
export async function saveSellerGoals(
  sellerId: string,
  periodId: string,
  goals: SellerGoalInput[],
): Promise<{ error?: string }> {
  await requireAdmin();

  const totalWeight = goals.reduce((sum, goal) => sum + goal.weight, 0);
  if (goals.length > 0 && Math.abs(totalWeight - 100) > 0.01) {
    return { error: `Os pesos somam ${totalWeight.toFixed(2)}%, mas devem somar 100%.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_seller_goals", {
    p_seller_id: sellerId,
    p_period_id: periodId,
    p_goals: goals.map((goal) => ({
      indicator_id: goal.indicatorId,
      target_value: goal.targetValue,
      weight: goal.weight,
    })),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/metas");
  revalidatePath(`/admin/metas/${sellerId}`);
  return {};
}
