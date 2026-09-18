import { createClient } from "@/lib/supabase/server";

/**
 * Wrapper tipado em torno das funções SQL calculate_ranking() e
 * calculate_indicator_attainment() (supabase/migrations/0002). Este
 * arquivo NUNCA reimplementa a aritmética do ranking — só chama a função
 * e formata o tipo de retorno para o TypeScript. O número exibido na tela
 * é sempre o número que o Postgres calculou.
 */

export type GeneralRankingRow = {
  seller_id: string;
  general_score: number | null;
  primary_indicator_id: string | null;
  primary_attainment_pct: number | null;
  primary_sales_count: number;
  primary_first_hit_date: string | null;
  rank_position: number;
};

export type IndicatorAttainmentRow = {
  seller_id: string;
  indicator_id: string;
  actual_value: number;
  target_value: number;
  attainment_pct: number;
  weight_used: number;
  weighted_score: number;
  first_goal_hit_date: string | null;
};

export async function getGeneralRanking(periodId: string): Promise<GeneralRankingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("calculate_ranking", { p_period_id: periodId });

  if (error) {
    throw new Error(`Não foi possível calcular o ranking: ${error.message}`);
  }

  return (data ?? []) as GeneralRankingRow[];
}

export async function getIndicatorAttainment(periodId: string): Promise<IndicatorAttainmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("calculate_indicator_attainment", {
    p_period_id: periodId,
  });

  if (error) {
    throw new Error(`Não foi possível calcular o atingimento: ${error.message}`);
  }

  return (data ?? []) as IndicatorAttainmentRow[];
}
