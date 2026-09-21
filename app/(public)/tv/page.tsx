import { getTvClient } from "@/lib/supabase/tv";
import { getGeneralRanking, getIndicatorAttainment } from "@/lib/ranking/scoring";
import { Podium } from "@/components/ranking/Podium";
import { TVModeClient, type TVSlideGroup } from "@/components/tv/TVModeClient";
import { formatIndicatorValue } from "@/lib/format";
import { getActiveTheme } from "@/lib/theme";

// Dados sempre ao vivo (login de conta de serviço + leitura em tempo real);
// nunca deve virar HTML estático gerado em build time.
export const dynamic = "force-dynamic";

const ANNOUNCEMENT_ACCENTS = [
  { bar: "bg-blue-500", badge: "bg-blue-500/15 text-blue-300", title: "text-blue-300" },
  { bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-300", title: "text-amber-300" },
  { bar: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-300", title: "text-emerald-300" },
  { bar: "bg-rose-500", badge: "bg-rose-500/15 text-rose-300", title: "text-rose-300" },
] as const;

function TVStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
      <p className="text-lg text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl leading-tight font-bold text-balance text-neutral-50">{value}</p>
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

  const activePeriods = periods.filter((candidate) => candidate.is_active);
  const periodsToShow = activePeriods.length > 0 ? activePeriods : [periods[0]];

  const [{ data: indicators }, { data: teams }, { data: sellers }, { data: announcements }, theme] =
    await Promise.all([
      supabase.from("indicators").select("id, name, unit").eq("is_active", true).order("name"),
      supabase.from("teams").select("id, name").eq("is_active", true).order("name"),
      supabase.from("sellers").select("id, full_name, photo_path, team_id"),
      supabase
        .from("announcements")
        .select("id, title, body")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6),
      getActiveTheme(supabase),
    ]);

  const sellerById = new Map((sellers ?? []).map((seller) => [seller.id, seller]));
  const sellerTeamById = new Map((sellers ?? []).map((seller) => [seller.id, seller.team_id]));
  const teamNameById = new Map((teams ?? []).map((team) => [team.id, team.name]));
  const indicatorById = new Map((indicators ?? []).map((indicator) => [indicator.id, indicator]));

  const groups: TVSlideGroup[] = await Promise.all(
    periodsToShow.map(async (period) => {
      const [{ data: teamGoals }, { data: periodResults }, ranking, attainment] = await Promise.all([
        supabase.from("team_goals").select("team_id, indicator_id, target_value").eq("period_id", period.id),
        supabase
          .from("sales_results")
          .select("indicator_id, value, seller_id")
          .gte("entry_date", period.start_date)
          .lte("entry_date", period.end_date),
        getGeneralRanking(period.id, supabase),
        getIndicatorAttainment(period.id, supabase),
      ]);

      const attainmentByKey = new Map(
        attainment.map((row) => [`${row.seller_id}:${row.indicator_id}`, row]),
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const periodEndDate = new Date(`${period.end_date}T00:00:00`);
      const daysRemaining = Math.max(0, Math.round((periodEndDate.getTime() - today.getTime()) / 86_400_000));

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
          const remaining = Math.max(0, target - realized);

          return {
            key: `${goal.team_id ?? "global"}:${goal.indicator_id}`,
            label: `${teamName} — ${indicator.name}`,
            unit: indicator.unit,
            realized,
            target,
            remaining,
            dailyAverageNeeded: daysRemaining > 0 ? remaining / daysRemaining : remaining,
            percent: target > 0 ? (realized / target) * 100 : 0,
          };
        })
        .filter((card): card is NonNullable<typeof card> => card !== null);

      const globalGoals = teamGoalCards
        .filter((card) => card.key.startsWith("global:"))
        .map((card) => ({ key: card.key, percent: card.percent }));

      const rankedSellers = ranking.filter((row) => row.primary_attainment_pct !== null);
      const metGoalCount = rankedSellers.filter((row) => (row.primary_attainment_pct ?? 0) >= 100).length;
      const belowGoalCount = rankedSellers.length - metGoalCount;
      const averageAttainment = rankedSellers.length
        ? rankedSellers.reduce((sum, row) => sum + (row.primary_attainment_pct ?? 0), 0) /
          rankedSellers.length
        : 0;
      const bestSellerName = rows[0]?.name ?? "—";

      const closestToGoal = [...rows]
        .filter((row) => row.percent < 100)
        .sort((a, b) => b.percent - a.percent)[0];

      const podiumEntries = rows.slice(0, 3).map((row) => ({
        sellerId: row.sellerId,
        name: row.name,
        photoPath: row.photoPath,
        resultLabel: row.resultLabel,
        percent: row.percent,
      }));

      const slide1 = (
        <div
          className="flex h-full flex-col items-center gap-6 overflow-hidden px-16 py-6"
          style={{ justifyContent: "safe center" }}
        >
          <Podium entries={podiumEntries} large theme={theme} />
        </div>
      );

      const slide2 = (
        <div
          className="flex h-full flex-col items-center gap-8 overflow-hidden px-16 py-6"
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
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-lg text-neutral-500">
                    <span>Faltam {formatIndicatorValue(card.remaining, card.unit)}</span>
                    <span>
                      {daysRemaining} dia{daysRemaining === 1 ? "" : "s"} restante
                      {daysRemaining === 1 ? "" : "s"} no período
                    </span>
                    <span>
                      Ritmo necessário/dia: {formatIndicatorValue(card.dailyAverageNeeded, card.unit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {closestToGoal && (
            <div className="flex w-full max-w-5xl items-center gap-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-4xl">
                🚀
              </span>
              <div className="min-w-0">
                <p className="text-lg text-neutral-400">Mais próximo de bater a meta</p>
                <p className="text-3xl font-bold text-balance text-neutral-50">{closestToGoal.name}</p>
                <p className="text-xl font-semibold text-amber-400">
                  {closestToGoal.percent.toFixed(0)}% da meta
                </p>
              </div>
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

      return {
        periodLabel: period.label,
        slides: [slide1, slide2],
        ranking: rows.map((row) => ({ sellerId: row.sellerId, rank: row.rank, name: row.name })),
        rankingRows: rows,
        globalGoals,
      };
    }),
  );

  const announcementsSlide =
    announcements && announcements.length > 0 ? (
      <div className="relative flex h-full flex-col items-center gap-4 overflow-hidden px-16 py-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 640px 360px at 50% 0%, rgba(37,99,235,0.14), transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative flex shrink-0 flex-col items-center gap-1 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600/15 text-2xl">
            📋
          </span>
          <h2 className="text-2xl font-black tracking-tight text-neutral-50">Avisos</h2>
          <p className="text-sm text-neutral-500">Comunicados da equipe</p>
        </div>

        <div
          className="relative flex min-h-0 w-full max-w-6xl flex-1 flex-wrap justify-center gap-5 overflow-hidden"
          style={{
            alignContent: "safe center",
            maskImage: "linear-gradient(to bottom, black 92%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 92%, transparent 100%)",
          }}
        >
          {announcements.map((announcement, index) => {
            const accent = ANNOUNCEMENT_ACCENTS[index % ANNOUNCEMENT_ACCENTS.length];
            const bodyLength = announcement.body.length;
            const bodyTextClass =
              bodyLength > 260
                ? "text-sm leading-snug"
                : bodyLength > 140
                  ? "text-base leading-snug"
                  : "text-lg leading-relaxed";
            return (
              <div
                key={announcement.id}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-lg shadow-black/40"
              >
                <div className={`h-1.5 w-full ${accent.bar}`} aria-hidden />
                <div className="space-y-2 p-5">
                  {announcement.title && (
                    <p className={`text-xl font-bold ${accent.title}`}>{announcement.title}</p>
                  )}
                  <p className={`text-balance whitespace-pre-wrap text-neutral-200 ${bodyTextClass}`}>
                    {announcement.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  return <TVModeClient groups={groups} announcementsSlide={announcementsSlide} />;
}
