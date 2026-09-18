import { createClient } from "@/lib/supabase/server";
import { getGeneralRanking } from "@/lib/ranking/scoring";
import { PeriodPicker } from "@/components/shared/PeriodPicker";
import { StatTile } from "@/components/dashboard/StatTile";
import { formatIndicatorValue } from "@/lib/format";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodIdParam } = await searchParams;
  const supabase = await createClient();

  const { data: periods } = await supabase
    .from("periods")
    .select("id, label, is_active, start_date, end_date")
    .order("start_date", { ascending: false });

  if (!periods?.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-neutral-50">Dashboard</h1>
        <p className="text-sm text-neutral-400">Nenhum período cadastrado ainda.</p>
      </div>
    );
  }

  const defaultPeriodId = periods.find((period) => period.is_active)?.id ?? periods[0].id;
  const periodId = periodIdParam ?? defaultPeriodId;
  const period = periods.find((candidate) => candidate.id === periodId) ?? periods[0];

  const [{ data: indicators }, { data: teamGoals }, { data: periodResults }, ranking, { data: sellers }] =
    await Promise.all([
      supabase.from("indicators").select("id, name, unit").eq("is_active", true).order("name"),
      supabase
        .from("team_goals")
        .select("indicator_id, target_value")
        .is("team_id", null)
        .eq("period_id", periodId),
      supabase
        .from("sales_results")
        .select("indicator_id, value")
        .gte("entry_date", period.start_date)
        .lte("entry_date", period.end_date),
      getGeneralRanking(periodId),
      supabase.from("sellers").select("id, full_name"),
    ]);

  const indicatorById = new Map((indicators ?? []).map((indicator) => [indicator.id, indicator]));
  const sellerById = new Map((sellers ?? []).map((seller) => [seller.id, seller]));

  const totalsByIndicator = new Map<string, number>();
  for (const result of periodResults ?? []) {
    totalsByIndicator.set(
      result.indicator_id,
      (totalsByIndicator.get(result.indicator_id) ?? 0) + Number(result.value),
    );
  }

  const rankedSellers = ranking.filter((row) => row.primary_attainment_pct !== null);
  const metGoalCount = rankedSellers.filter((row) => (row.primary_attainment_pct ?? 0) >= 100).length;
  const belowGoalCount = rankedSellers.length - metGoalCount;
  const averageAttainment = rankedSellers.length
    ? rankedSellers.reduce((sum, row) => sum + (row.primary_attainment_pct ?? 0), 0) /
      rankedSellers.length
    : 0;
  const bestSeller = [...ranking].sort((a, b) => a.rank_position - b.rank_position)[0];
  const bestSellerName = bestSeller ? sellerById.get(bestSeller.seller_id)?.full_name ?? "—" : "—";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(`${period.end_date}T00:00:00`);
  const daysRemaining = Math.max(0, Math.round((endDate.getTime() - today.getTime()) / 86_400_000));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-50">Dashboard</h1>
        <PeriodPicker periods={periods} selectedId={periodId} basePath="/dashboard" />
      </div>

      {!!teamGoals?.length && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-neutral-100">Meta da equipe</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {teamGoals.map((goal) => {
              const indicator = indicatorById.get(goal.indicator_id);
              if (!indicator) return null;

              const realized = totalsByIndicator.get(goal.indicator_id) ?? 0;
              const target = Number(goal.target_value);
              const percent = target > 0 ? (realized / target) * 100 : 0;
              const remaining = Math.max(0, target - realized);
              const dailyAverageNeeded = daysRemaining > 0 ? remaining / daysRemaining : remaining;

              return (
                <div
                  key={goal.indicator_id}
                  className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm text-neutral-400">{indicator.name}</p>
                    <p className="text-sm font-medium text-neutral-300">{percent.toFixed(1)}%</p>
                  </div>
                  <p className="text-2xl font-bold text-neutral-50">
                    {formatIndicatorValue(realized, indicator.unit)}
                    <span className="text-base font-normal text-neutral-500">
                      {" "}
                      / {formatIndicatorValue(target, indicator.unit)}
                    </span>
                  </p>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-500">
                    <span>Faltam {formatIndicatorValue(remaining, indicator.unit)}</span>
                    <span>{daysRemaining} dia(s) restante(s) no período</span>
                    <span>
                      Média necessária/dia: {formatIndicatorValue(dailyAverageNeeded, indicator.unit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-100">Resumo da equipe</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Bateram a meta" value={String(metGoalCount)} />
          <StatTile label="Abaixo da meta" value={String(belowGoalCount)} />
          <StatTile label="Média de atingimento" value={`${averageAttainment.toFixed(0)}%`} />
          <StatTile label="Melhor vendedor" value={bestSellerName} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-100">Totais por indicador</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(indicators ?? []).map((indicator) => (
            <StatTile
              key={indicator.id}
              label={indicator.name}
              value={formatIndicatorValue(totalsByIndicator.get(indicator.id) ?? 0, indicator.unit)}
            />
          ))}
          {!indicators?.length && (
            <p className="text-sm text-neutral-500">Nenhum indicador ativo.</p>
          )}
        </div>
      </section>
    </div>
  );
}
