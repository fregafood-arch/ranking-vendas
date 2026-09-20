import { getTvClient } from "@/lib/supabase/tv";
import { getGeneralRanking, getIndicatorAttainment } from "@/lib/ranking/scoring";
import { Podium } from "@/components/ranking/Podium";
import { TVRankingRow } from "@/components/tv/TVRankingRow";
import { TVModeClient } from "@/components/tv/TVModeClient";
import { formatIndicatorValue } from "@/lib/format";
import { getActiveTheme } from "@/lib/theme";

// Dados sempre ao vivo (login de conta de serviço + leitura em tempo real);
// nunca deve virar HTML estático gerado em build time.
export const dynamic = "force-dynamic";

function TVStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
      <p className="text-lg text-neutral-500">{label}</p>
      <p className="mt-2 truncate text-3xl font-bold text-neutral-50">{value}</p>
    </div>
  );
}

export default async function TvModePage() {
  const supabase = await getTvClient();

  const { data: periods } = await supabase
    .from("periods")
    .select("id, label, is_active, start_date, end_date")
    .order("start_date", { ascending: false });

  if (!periods?.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <p className="text-2xl text-neutral-500">Nenhum período cadastrado ainda.</p>
      </div>
    );
  }

  const period = periods.find((candidate) => candidate.is_active) ?? periods[0];

  const [
    { data: indicators },
    { data: teams },
    { data: teamGoals },
    { data: periodResults },
    ranking,
    attainment,
    { data: sellers },
    theme,
  ] = await Promise.all([
    supabase.from("indicators").select("id, name, unit").eq("is_active", true).order("name"),
    supabase.from("teams").select("id, name").eq("is_active", true).order("name"),
    supabase.from("team_goals").select("team_id, indicator_id, target_value").eq("period_id", period.id),
    supabase
      .from("sales_results")
      .select("indicator_id, value, seller_id")
      .gte("entry_date", period.start_date)
      .lte("entry_date", period.end_date),
    getGeneralRanking(period.id, supabase),
    getIndicatorAttainment(period.id, supabase),
    supabase.from("sellers").select("id, full_name, photo_path, team_id"),
    getActiveTheme(supabase),
  ]);

  const sellerById = new Map((sellers ?? []).map((seller) => [seller.id, seller]));
  const sellerTeamById = new Map((sellers ?? []).map((seller) => [seller.id, seller.team_id]));
  const teamNameById = new Map((teams ?? []).map((team) => [team.id, team.name]));
  const indicatorById = new Map((indicators ?? []).map((indicator) => [indicator.id, indicator]));
  const attainmentByKey = new Map(
    attainment.map((row) => [`${row.seller_id}:${row.indicator_id}`, row]),
  );

  const rows = [...ranking]
    .sort((a, b) => a.rank_position - b.rank_position)
    .map((row) => {
      const seller = sellerById.get(row.seller_id);
      const primaryIndicator = row.primary_indicator_id
        ? indicatorById.get(row.primary_indicator_id)
        : undefined;
      const primaryAttainment = row.primary_indicator_id
        ? attainmentByKey.get(`${row.seller_id}:${row.primary_indicator_id}`)
        : undefined;

      return {
        rank: row.rank_position,
        sellerId: row.seller_id,
        name: seller?.full_name ?? "Vendedor removido",
        photoPath: seller?.photo_path ?? null,
        resultLabel:
          primaryAttainment && primaryIndicator
            ? formatIndicatorValue(primaryAttainment.actual_value, primaryIndicator.unit)
            : "—",
        percent: row.primary_attainment_pct ?? 0,
      };
    });

  const totalsByIndicator = new Map<string, number>();
  const totalsByTeamIndicator = new Map<string, number>();
  for (const result of periodResults ?? []) {
    totalsByIndicator.set(
      result.indicator_id,
      (totalsByIndicator.get(result.indicator_id) ?? 0) + Number(result.value),
    );

    const teamId = sellerTeamById.get(result.seller_id);
    if (teamId) {
      const key = `${teamId}:${result.indicator_id}`;
      totalsByTeamIndicator.set(key, (totalsByTeamIndicator.get(key) ?? 0) + Number(result.value));
    }
  }

  const teamGoalCards = (teamGoals ?? [])
    .map((goal) => {
      const indicator = indicatorById.get(goal.indicator_id);
      if (!indicator) return null;

      const teamName = goal.team_id ? (teamNameById.get(goal.team_id) ?? "Equipe") : "Empresa toda";
      const realized = goal.team_id
        ? (totalsByTeamIndicator.get(`${goal.team_id}:${goal.indicator_id}`) ?? 0)
        : (totalsByIndicator.get(goal.indicator_id) ?? 0);
      const target = Number(goal.target_value);

      return {
        key: `${goal.team_id ?? "global"}:${goal.indicator_id}`,
        label: `${teamName} — ${indicator.name}`,
        unit: indicator.unit,
        realized,
        target,
        percent: target > 0 ? (realized / target) * 100 : 0,
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

  const rankedSellers = ranking.filter((row) => row.primary_attainment_pct !== null);
  const metGoalCount = rankedSellers.filter((row) => (row.primary_attainment_pct ?? 0) >= 100).length;
  const belowGoalCount = rankedSellers.length - metGoalCount;
  const averageAttainment = rankedSellers.length
    ? rankedSellers.reduce((sum, row) => sum + (row.primary_attainment_pct ?? 0), 0) /
      rankedSellers.length
    : 0;
  const bestSellerName = rows[0]?.name ?? "—";

  const podiumEntries = rows.slice(0, 3).map((row) => ({
    sellerId: row.sellerId,
    name: row.name,
    photoPath: row.photoPath,
    resultLabel: row.resultLabel,
    percent: row.percent,
  }));
  const restRows = rows.slice(3);

  const slide1 = (
    <div
      className="flex h-full flex-col items-center gap-6 overflow-hidden px-16 py-6"
      style={{ justifyContent: "safe center" }}
    >
      <Podium entries={podiumEntries} large theme={theme} />
      {restRows.length > 0 && (
        <div className="w-full max-w-5xl space-y-3">
          {restRows.slice(0, 3).map((row) => (
            <TVRankingRow
              key={row.sellerId}
              rank={row.rank}
              name={row.name}
              photoPath={row.photoPath}
              percent={row.percent}
              resultLabel={row.resultLabel}
            />
          ))}
        </div>
      )}
    </div>
  );

  const slide2 = (
    <div
      className="flex h-full flex-col items-center gap-12 overflow-hidden px-16 py-6"
      style={{ justifyContent: "safe center" }}
    >
      {teamGoalCards.length > 0 && (
        <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          {teamGoalCards.map((card) => (
            <div
              key={card.key}
              className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-8"
            >
              <p className="text-2xl text-neutral-400">Meta — {card.label}</p>
              <p className="text-5xl font-bold text-neutral-50">
                {formatIndicatorValue(card.realized, card.unit)}
                <span className="text-2xl font-normal text-neutral-500">
                  {" "}
                  / {formatIndicatorValue(card.target, card.unit)}
                </span>
              </p>
              <div className="h-4 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(card.percent, 100)}%` }}
                />
              </div>
              <p className="text-3xl font-semibold text-emerald-400">{card.percent.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid w-full max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
        <TVStat label="Bateram a meta" value={String(metGoalCount)} />
        <TVStat label="Abaixo da meta" value={String(belowGoalCount)} />
        <TVStat label="Média de atingimento" value={`${averageAttainment.toFixed(0)}%`} />
        <TVStat label="Melhor vendedor" value={bestSellerName} />
      </div>
    </div>
  );

  const slide3 = (
    <div
      className="flex h-full flex-col gap-3 overflow-hidden px-16 py-10"
      style={{ justifyContent: "safe center" }}
    >
      {rows.map((row) => (
        <TVRankingRow
          key={row.sellerId}
          rank={row.rank}
          name={row.name}
          photoPath={row.photoPath}
          percent={row.percent}
          resultLabel={row.resultLabel}
        />
      ))}
      {!rows.length && (
        <p className="text-center text-2xl text-neutral-500">
          Nenhum vendedor com metas configuradas neste período.
        </p>
      )}
    </div>
  );

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-900 px-10 py-4">
        <p className="text-2xl font-semibold text-neutral-50">Ranking de Vendas</p>
        <div className="flex items-center gap-3 text-lg text-neutral-400">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          {period.label}
        </div>
      </header>
      <div className="relative flex-1">
        <TVModeClient slides={[slide1, slide2, slide3]} />
      </div>
    </div>
  );
}
