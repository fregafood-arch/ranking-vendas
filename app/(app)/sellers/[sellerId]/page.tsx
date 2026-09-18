import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGeneralRanking, getIndicatorAttainment } from "@/lib/ranking/scoring";
import { SellerAvatar } from "@/components/sellers/SellerAvatar";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { ProgressBar } from "@/components/ranking/ProgressBar";
import { formatIndicatorValue } from "@/lib/format";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function SellerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { sellerId } = await params;
  const { period: periodIdParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: seller }, { data: periods }] = await Promise.all([
    supabase
      .from("sellers")
      .select("id, full_name, role_title, photo_path, start_date, is_active")
      .eq("id", sellerId)
      .single(),
    supabase
      .from("periods")
      .select("id, label, is_active, start_date, end_date")
      .order("start_date", { ascending: false }),
  ]);

  if (!seller) {
    notFound();
  }

  const defaultPeriodId = periods?.find((period) => period.is_active)?.id ?? periods?.[0]?.id ?? null;
  const periodId = periodIdParam ?? defaultPeriodId;

  const { data: achievementsData } = await supabase
    .from("seller_achievements")
    .select("id, earned_at, achievements(name, icon)")
    .eq("seller_id", sellerId)
    .order("earned_at", { ascending: false });

  type AchievementRow = NonNullable<typeof achievementsData>[number];
  type AchievementWithDetails = Omit<AchievementRow, "achievements"> & {
    achievements: { name: string; icon: string } | null;
  };
  const achievements = (achievementsData ?? []) as unknown as AchievementWithDetails[];

  const { data: historyData } = await supabase
    .from("sales_results")
    .select("id, value, entry_date, indicators(name, unit)")
    .eq("seller_id", sellerId)
    .order("entry_date", { ascending: false })
    .limit(30);

  type HistoryRow = NonNullable<typeof historyData>[number];
  type HistoryWithIndicator = Omit<HistoryRow, "indicators"> & {
    indicators: { name: string; unit: string } | null;
  };
  const history = (historyData ?? []) as unknown as HistoryWithIndicator[];

  const { data: indicators } = await supabase.from("indicators").select("id, name, unit");
  const indicatorById = new Map((indicators ?? []).map((indicator) => [indicator.id, indicator]));

  let currentRank: number | null = null;
  let currentScore: number | null = null;
  let indicatorRows: Awaited<ReturnType<typeof getIndicatorAttainment>> = [];
  let currentPeriodLabel: string | null = null;

  if (periodId) {
    const [ranking, attainment] = await Promise.all([
      getGeneralRanking(periodId),
      getIndicatorAttainment(periodId),
    ]);
    const sellerRanking = ranking.find((row) => row.seller_id === sellerId);
    currentRank = sellerRanking?.rank_position ?? null;
    currentScore = sellerRanking?.general_score ?? null;
    indicatorRows = attainment.filter((row) => row.seller_id === sellerId);
    currentPeriodLabel = periods?.find((period) => period.id === periodId)?.label ?? null;
  }

  const pastPositions: { label: string; rank: number | null }[] = [];
  for (const period of (periods ?? []).slice(0, 6)) {
    const ranking = await getGeneralRanking(period.id);
    const row = ranking.find((entry) => entry.seller_id === sellerId);
    pastPositions.push({ label: period.label, rank: row?.rank_position ?? null });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <SellerAvatar photoPath={seller.photo_path} name={seller.full_name} size={72} />
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">{seller.full_name}</h1>
          <p className="text-sm text-neutral-400">{seller.role_title ?? "—"}</p>
          <p className="text-xs text-neutral-500">
            Na equipe desde {formatDate(seller.start_date)}
            {!seller.is_active && " · inativo"}
          </p>
        </div>
      </div>

      {periodId && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Desempenho {currentPeriodLabel ? `— ${currentPeriodLabel}` : ""}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-xs text-neutral-500">Posição atual</p>
              <p className="mt-1 text-xl font-semibold text-neutral-50">
                {currentRank ? `${currentRank}º` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-xs text-neutral-500">Pontuação</p>
              <p className="mt-1 text-xl font-semibold text-neutral-50">
                {currentScore !== null ? currentScore.toFixed(1) : "—"}
              </p>
            </div>
            {indicatorRows.slice(0, 2).map((row) => (
              <div key={row.indicator_id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <p className="text-xs text-neutral-500">
                  % — {indicatorById.get(row.indicator_id)?.name ?? "Indicador"}
                </p>
                <p className="mt-1 text-xl font-semibold text-neutral-50">{row.attainment_pct.toFixed(0)}%</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {indicatorRows.map((row) => {
              const indicator = indicatorById.get(row.indicator_id);
              return (
                <div key={row.indicator_id} className="rounded-lg border border-neutral-800 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">{indicator?.name ?? "Indicador"}</span>
                    <span className="font-medium text-neutral-100">{row.attainment_pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar percent={row.attainment_pct} />
                    <span className="whitespace-nowrap text-xs text-neutral-500">
                      {indicator
                        ? `${formatIndicatorValue(row.actual_value, indicator.unit)} / ${formatIndicatorValue(row.target_value, indicator.unit)}`
                        : `${row.actual_value} / ${row.target_value}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-neutral-100">Conquistas</h2>
        {achievements.length ? (
          <div className="flex flex-wrap gap-3">
            {achievements.map((entry) =>
              entry.achievements ? (
                <AchievementBadge
                  key={entry.id}
                  icon={entry.achievements.icon}
                  name={entry.achievements.name}
                  earnedAt={entry.earned_at}
                />
              ) : null,
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Nenhuma conquista ainda.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-neutral-100">Posição nos últimos períodos</h2>
        <div className="flex flex-wrap gap-3">
          {pastPositions.map((entry) => (
            <div key={entry.label} className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2">
              <p className="text-xs text-neutral-500">{entry.label}</p>
              <p className="text-sm font-semibold text-neutral-100">{entry.rank ? `${entry.rank}º` : "—"}</p>
            </div>
          ))}
          {!pastPositions.length && <p className="text-sm text-neutral-500">Nenhum período encontrado.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-neutral-100">Histórico de resultados</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Indicador</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {history.map((entry) => (
                <tr key={entry.id} className="text-neutral-200">
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                    {entry.indicators?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {entry.indicators
                      ? formatIndicatorValue(Number(entry.value), entry.indicators.unit)
                      : entry.value}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                    {formatDate(entry.entry_date)}
                  </td>
                </tr>
              ))}
              {!history.length && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                    Nenhum lançamento ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Link href="/ranking" className="inline-block text-sm text-neutral-400 hover:text-neutral-50">
        Voltar ao Ranking
      </Link>
    </div>
  );
}
