import { createClient } from "@/lib/supabase/server";
import { getGeneralRanking, getIndicatorAttainment } from "@/lib/ranking/scoring";
import { PeriodPicker } from "@/components/shared/PeriodPicker";
import { StatTile } from "@/components/dashboard/StatTile";
import { HighlightCard } from "@/components/dashboard/HighlightCard";
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
    .select("id, type, label, is_active, start_date, end_date")
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

  const [
    { data: indicators },
    { data: teamGoals },
    { data: periodResults },
    ranking,
    attainment,
    { data: sellers },
  ] = await Promise.all([
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
    getIndicatorAttainment(periodId),
    supabase.from("sellers").select("id, full_name"),
  ]);

  const indicatorById = new Map((indicators ?? []).map((indicator) => [indicator.id, indicator]));
  const sellerById = new Map((sellers ?? []).map((seller) => [seller.id, seller]));
  const attainmentByKey = new Map(
    attainment.map((row) => [`${row.seller_id}:${row.indicator_id}`, row]),
  );

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

  // ------------------------------------------------------------------------
  // Destaques automáticos (item 12 do briefing) — sempre calculados a
  // partir dos dados já carregados, nunca gravados em tabela: são um
  // retrato do momento, recalculados a cada carregamento da tela.
  // ------------------------------------------------------------------------
  const nameOf = (sellerId: string) => sellerById.get(sellerId)?.full_name ?? null;

  const topAttainmentRow = [...rankedSellers].sort(
    (a, b) => (b.primary_attainment_pct ?? 0) - (a.primary_attainment_pct ?? 0),
  )[0];

  const closestToGoalRow = [...rankedSellers]
    .filter((row) => (row.primary_attainment_pct ?? 0) < 100)
    .sort((a, b) => (b.primary_attainment_pct ?? 0) - (a.primary_attainment_pct ?? 0))[0];

  const mostRecentlyExceededRow = [...rankedSellers]
    .filter((row) => (row.primary_attainment_pct ?? 0) >= 100 && row.primary_first_hit_date)
    .sort((a, b) => (b.primary_first_hit_date ?? "").localeCompare(a.primary_first_hit_date ?? ""))[0];

  const topVolumeEntry = rankedSellers
    .map((row) => {
      const primaryAttainment = row.primary_indicator_id
        ? attainmentByKey.get(`${row.seller_id}:${row.primary_indicator_id}`)
        : undefined;
      return { row, actualValue: primaryAttainment?.actual_value ?? 0 };
    })
    .sort((a, b) => b.actualValue - a.actualValue)[0];

  function primaryValueLabel(sellerId: string, indicatorId: string | null) {
    if (!indicatorId) return null;
    const indicator = indicatorById.get(indicatorId);
    const value = attainmentByKey.get(`${sellerId}:${indicatorId}`);
    if (!indicator || !value) return null;
    return formatIndicatorValue(value.actual_value, indicator.unit);
  }

  // 🔥 Maior crescimento: compara com o período anterior do mesmo tipo.
  const { data: previousPeriods } = await supabase
    .from("periods")
    .select("id, label")
    .eq("type", period.type)
    .lt("start_date", period.start_date)
    .order("start_date", { ascending: false })
    .limit(1);
  const previousPeriod = previousPeriods?.[0] ?? null;

  let growthCard = { icon: "🔥", title: "Maior crescimento", sellerName: null as string | null, value: null as string | null };
  if (previousPeriod) {
    const previousRanking = await getGeneralRanking(previousPeriod.id);
    const previousScoreBySeller = new Map(
      previousRanking.map((row) => [row.seller_id, row.general_score ?? 0]),
    );
    const best = rankedSellers
      .filter((row) => previousScoreBySeller.has(row.seller_id))
      .map((row) => ({
        sellerId: row.seller_id,
        growth: (row.general_score ?? 0) - (previousScoreBySeller.get(row.seller_id) ?? 0),
      }))
      .sort((a, b) => b.growth - a.growth)[0];

    if (best && best.growth > 0) {
      growthCard = {
        icon: "🔥",
        title: "Maior crescimento",
        sellerName: nameOf(best.sellerId),
        value: `+${best.growth.toFixed(1)} pts vs ${previousPeriod.label}`,
      };
    }
  }

  // ⭐ Melhor desempenho da semana: período do tipo Semanal mais recente.
  const { data: weeklyPeriods } = await supabase
    .from("periods")
    .select("id, label")
    .eq("type", "WEEKLY")
    .order("start_date", { ascending: false })
    .limit(1);
  const weeklyPeriod = weeklyPeriods?.[0] ?? null;

  let weeklyCard = { icon: "⭐", title: "Melhor desempenho da semana", sellerName: null as string | null, value: null as string | null };
  if (weeklyPeriod) {
    const weeklyRanking = await getGeneralRanking(weeklyPeriod.id);
    const best = [...weeklyRanking].sort((a, b) => a.rank_position - b.rank_position)[0];
    if (best) {
      weeklyCard = {
        icon: "⭐",
        title: "Melhor desempenho da semana",
        sellerName: nameOf(best.seller_id),
        value: weeklyPeriod.label,
      };
    }
  }

  const highlights = [
    growthCard,
    {
      icon: "🚀",
      title: "Mais próximo da meta",
      sellerName: closestToGoalRow ? nameOf(closestToGoalRow.seller_id) : null,
      value: closestToGoalRow ? `${(closestToGoalRow.primary_attainment_pct ?? 0).toFixed(0)}% da meta` : null,
    },
    {
      icon: "🏆",
      title: "Meta superada",
      sellerName: mostRecentlyExceededRow ? nameOf(mostRecentlyExceededRow.seller_id) : null,
      value: mostRecentlyExceededRow
        ? `${(mostRecentlyExceededRow.primary_attainment_pct ?? 0).toFixed(0)}% da meta`
        : null,
    },
    weeklyCard,
    {
      icon: "🎯",
      title: "Maior percentual da meta",
      sellerName: topAttainmentRow ? nameOf(topAttainmentRow.seller_id) : null,
      value: topAttainmentRow ? `${(topAttainmentRow.primary_attainment_pct ?? 0).toFixed(0)}% da meta` : null,
    },
    {
      icon: "💰",
      title: "Maior volume vendido",
      sellerName: topVolumeEntry ? nameOf(topVolumeEntry.row.seller_id) : null,
      value: topVolumeEntry
        ? primaryValueLabel(topVolumeEntry.row.seller_id, topVolumeEntry.row.primary_indicator_id)
        : null,
    },
  ];

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
        <h2 className="text-lg font-medium text-neutral-100">Destaques</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {highlights.map((highlight) => (
            <HighlightCard key={highlight.title} {...highlight} />
          ))}
        </div>
      </section>

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
